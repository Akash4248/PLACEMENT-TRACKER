require("dotenv").config();

const mongoose = require("mongoose");
const Application = require("./models/Application");
const Company = require("./models/Company");
const InterviewRound = require("./models/InterviewRound");

const numberedCompanyPattern = /^(.+?)\s+\d+$/;

const cleanup = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const companies = await Company.find().sort({ createdAt: 1 });
  const companiesByName = new Map(
    companies.map((company) => [company.companyName, company])
  );

  let removedCompanies = 0;
  let movedApplications = 0;
  let deletedDuplicateApplications = 0;
  let deletedRounds = 0;

  for (const company of companies) {
    const match = company.companyName.match(numberedCompanyPattern);

    if (!match) {
      continue;
    }

    const baseName = match[1].trim();
    const baseCompany = companiesByName.get(baseName);

    if (!baseCompany) {
      continue;
    }

    const [duplicateRounds, baseRounds] = await Promise.all([
      InterviewRound.find({ companyId: company._id }),
      InterviewRound.find({ companyId: baseCompany._id }),
    ]);
    const baseRoundByName = new Map(
      baseRounds.map((round) => [round.roundName, round])
    );
    const roundIdMap = new Map();

    duplicateRounds.forEach((round) => {
      const baseRound = baseRoundByName.get(round.roundName);

      if (baseRound) {
        roundIdMap.set(String(round._id), baseRound._id);
      }
    });

    const applications = await Application.find({
      companyId: company._id,
    });

    for (const application of applications) {
      const existingBaseApplication =
        await Application.findOne({
          studentId: application.studentId,
          companyId: baseCompany._id,
        });

      if (existingBaseApplication) {
        await Application.deleteOne({
          _id: application._id,
        });
        deletedDuplicateApplications += 1;
      } else {
        application.companyId = baseCompany._id;
        application.rounds.forEach((roundResult) => {
          const mappedRoundId = roundIdMap.get(
            String(roundResult.roundId)
          );

          if (mappedRoundId) {
            roundResult.roundId = mappedRoundId;
          }
        });
        await application.save();
        movedApplications += 1;
      }
    }

    const roundResult =
      await InterviewRound.deleteMany({
        companyId: company._id,
      });
    deletedRounds += roundResult.deletedCount;

    await Company.deleteOne({ _id: company._id });
    removedCompanies += 1;
  }

  console.log("Company cleanup summary");
  console.log("-----------------------");
  console.log(`Removed companies: ${removedCompanies}`);
  console.log(`Moved applications: ${movedApplications}`);
  console.log(
    `Deleted duplicate applications: ${deletedDuplicateApplications}`
  );
  console.log(`Deleted duplicate rounds: ${deletedRounds}`);
};

cleanup()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
