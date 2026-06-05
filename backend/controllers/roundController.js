const InterviewRound = require(
  "../models/InterviewRound"
);
const Application = require("../models/Application");

const createRound = async (
  req,
  res
) => {
  try {
    const round =
      await InterviewRound.create(req.body);

    res.status(201).json({
      success: true,
      round,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoundsByCompany =
  async (req, res) => {
    try {
      const rounds =
        await InterviewRound.find({
          companyId: req.params.companyId,
        }).sort({
          sequence: 1,
        });

      res.json({
        success: true,
        rounds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

const updateRound = async (
  req,
  res
) => {
  try {
    const round =
      await InterviewRound.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json({
      success: true,
      round,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRound = async (
  req,
  res
) => {
  try {
    await InterviewRound.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Round deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoundAnalyticsByCompany = async (
  req,
  res
) => {
  try {
    const rounds = await InterviewRound.find({
      companyId: req.params.companyId,
    }).sort({ sequence: 1 });
    const applications = await Application.find({
      companyId: req.params.companyId,
    });

    const analytics = rounds.map((round) => {
      const roundResults = applications
        .map((application) =>
          application.rounds.find(
            (item) =>
              String(item.roundId) ===
              String(round._id)
          )
        )
        .filter(Boolean);
      const appeared = roundResults.length;
      const passed = roundResults.filter(
        (item) => item.result === "PASS"
      ).length;
      const failed = roundResults.filter(
        (item) => item.result === "FAIL"
      ).length;

      return {
        _id: round._id,
        roundName: round.roundName,
        roundType: round.roundType,
        sequence: round.sequence,
        appeared,
        passed,
        failed,
        passRate: appeared
          ? Math.round((passed / appeared) * 100)
          : 0,
      };
    });

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoundApplications = async (req, res) => {
  try {
    const round = await InterviewRound.findById(
      req.params.roundId
    ).populate("companyId");

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    const applications = await Application.find({
      companyId: round.companyId._id,
      $or: [
        { currentRound: round.sequence },
        { "rounds.roundId": round._id },
      ],
    })
      .populate("studentId")
      .populate("companyId");

    const rows = applications.map((application) => {
      const roundResult = application.rounds.find(
        (item) =>
          String(item.roundId) === String(round._id)
      );

      return {
        _id: application._id,
        application,
        student: application.studentId,
        currentStatus: application.status,
        result: roundResult?.result || "PENDING",
        attended: roundResult?.attended || false,
      };
    });

    res.json({
      success: true,
      round,
      applications: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const applyRoundAction = async (
  roundId,
  applicationIds,
  action
) => {
  const round = await InterviewRound.findById(roundId);

  if (!round) {
    throw new Error("Round not found");
  }

  const totalRounds =
    await InterviewRound.countDocuments({
      companyId: round.companyId,
    });
  const applications = await Application.find({
    _id: { $in: applicationIds },
    companyId: round.companyId,
  });

  for (const application of applications) {
    const existing = application.rounds.find(
      (item) =>
        String(item.roundId) === String(round._id)
    );
    const result =
      action === "pass" ? "PASS" : "FAIL";
    const attended = action !== "absent";

    if (existing) {
      existing.result = result;
      existing.attended = attended;
    } else {
      application.rounds.push({
        roundId: round._id,
        attended,
        result,
      });
    }

    if (action === "pass") {
      application.currentRound = Math.max(
        application.currentRound,
        round.sequence + 1
      );
      application.status =
        application.currentRound > totalRounds
          ? "Selected"
          : "In Process";
    } else {
      application.status = "Rejected";
      application.currentRound = round.sequence;
    }

    await application.save();
  }

  return applications.length;
};

const bulkPassRound = async (req, res) => {
  try {
    const affectedCount = await applyRoundAction(
      req.params.roundId,
      req.body.applicationIds || [],
      "pass"
    );

    res.json({ success: true, affectedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkRejectRound = async (req, res) => {
  try {
    const affectedCount = await applyRoundAction(
      req.params.roundId,
      req.body.applicationIds || [],
      "reject"
    );

    res.json({ success: true, affectedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkAbsentRound = async (req, res) => {
  try {
    const affectedCount = await applyRoundAction(
      req.params.roundId,
      req.body.applicationIds || [],
      "absent"
    );

    res.json({ success: true, affectedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRound,
  getRoundsByCompany,
  updateRound,
  deleteRound,
  getRoundAnalyticsByCompany,
  getRoundApplications,
  bulkPassRound,
  bulkRejectRound,
  bulkAbsentRound,
};
