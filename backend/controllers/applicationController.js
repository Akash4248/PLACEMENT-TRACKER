const Application = require(
  "../models/Application"
);

const InterviewRound = require(
  "../models/InterviewRound"
);
const Student = require("../models/Student");
const { parseSpreadsheet } = require("../utils/fileParser");

const applyRoundResult = async (
  application,
  { roundId, attended, result }
) => {
  application.status = "In Process";

  application.rounds.push({
    roundId,
    attended,
    result,
  });

  if (
    result === "FAIL" ||
    (attended === false &&
      result !== "PENDING")
  ) {
    application.status = "Rejected";
  }

  if (result === "PASS") {
    application.currentRound += 1;

    const totalRounds =
      await InterviewRound.countDocuments({
        companyId: application.companyId,
      });

    if (
      application.currentRound >
      totalRounds
    ) {
      application.status = "Selected";
    }
  }

  await application.save();
  return application;
};

const createApplication = async (req, res) => {
  try {
    const { studentId, companyId } = req.body;

    const existing =
      await Application.findOne({
        studentId,
        companyId,
      });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Student already applied to this company",
      });
    }

    const application =
      await Application.create({
        studentId,
        companyId,
      });

    res.status(201).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getApplications =
  async (req, res) => {
    try {
      const {
        status,
        companyId,
      } = req.query;

      let filter = {};

      if (status) {
        filter.status = status;
      }

      if (companyId) {
        filter.companyId =
          companyId;
      }

      const applications =
        await Application.find(
          filter
        )
          .populate("studentId")
          .populate("companyId");

      res.json({
        success: true,
        applications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
const updateRoundResult =
  async (req, res) => {
    try {
      const {
        roundId,
        attended,
        result,
      } = req.body;

      const application =
        await Application.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      await applyRoundResult(application, {
        roundId,
        attended,
        result,
      });

      res.json({
        success: true,
        application,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

const bulkUploadResults = async (req, res) => {
  try {
    const rows = parseSpreadsheet(req.file);
    const errors = [];
    let updated = 0;
    let failed = 0;

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const usn = String(
        row.usn || row.USN || ""
      ).trim();
      const roundId = String(
        row.roundid || row.round_id || ""
      ).trim();
      const result = String(
        row.result || ""
      )
        .trim()
        .toUpperCase();

      if (
        !usn ||
        !roundId ||
        !["PASS", "FAIL", "PENDING"].includes(
          result
        )
      ) {
        failed += 1;
        errors.push({
          row: rowNumber,
          message:
            "USN, ROUND_ID, and RESULT (PASS/FAIL/PENDING) are required",
        });
        continue;
      }

      const student = await Student.findOne({
        usn,
      });
      const round =
        await InterviewRound.findById(roundId);

      if (!student || !round) {
        failed += 1;
        errors.push({
          row: rowNumber,
          message: !student
            ? "Student not found"
            : "Round not found",
        });
        continue;
      }

      const application =
        await Application.findOne({
          studentId: student._id,
          companyId: round.companyId,
        });

      if (!application) {
        failed += 1;
        errors.push({
          row: rowNumber,
          message:
            "Application not found for student and round company",
        });
        continue;
      }

      await applyRoundResult(application, {
        roundId,
        attended: result !== "PENDING",
        result,
      });
      updated += 1;
    }

    res.json({
      success: true,
      updated,
      failed,
      errors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getApplication = async (
  req,
  res
) => {
  try {
    const application =
      await Application.findById(
        req.params.id
      )
        .populate("studentId")
        .populate("companyId")
        .populate("rounds.roundId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found",
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const markOfferReceived =
  async (req, res) => {
    try {
      const application =
        await Application.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      application.status =
        "Offer Received";

      await application.save();

      res.json({
        success: true,
        application,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

const deleteApplication =
  async (req, res) => {
    try {
      await Application.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Application deleted",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  createApplication,
  getApplications,
  updateRoundResult,
  getApplication,
  markOfferReceived,
  deleteApplication,
  bulkUploadResults,
};
