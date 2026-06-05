const Application = require(
  "../models/Application"
);

const InterviewRound = require(
  "../models/InterviewRound"
);
const Student = require("../models/Student");
const Company = require("../models/Company");
const { parseSpreadsheet } = require("../utils/fileParser");
const createAuditLog = require("../utils/audit");

const applyRoundResult = async (
  application,
  { roundId, attended, result, attendanceStatus }
) => {
  const normalizedAttendance =
    attendanceStatus ||
    (attended === true
      ? "Present"
      : attended === false
        ? "Absent"
        : "Not Marked");
  const normalizedResult =
    normalizedAttendance === "Absent" ? "FAIL" : result;

  if (normalizedAttendance === "Absent" && result === "PASS") {
    const error = new Error("Absent candidates cannot be marked PASS.");
    error.status = 400;
    throw error;
  }

  application.status = "In Process";

  const existingRound = application.rounds.find(
    (item) => String(item.roundId) === String(roundId)
  );

  const roundPayload = {
    roundId,
    attended: normalizedAttendance === "Present",
    attendanceStatus: normalizedAttendance,
    result: normalizedResult,
  };

  if (existingRound) {
    existingRound.attended = roundPayload.attended;
    existingRound.attendanceStatus = roundPayload.attendanceStatus;
    existingRound.result = roundPayload.result;
  } else {
    application.rounds.push(roundPayload);
  }

  if (
    normalizedResult === "FAIL" ||
    normalizedAttendance === "Absent" ||
    (attended === false && normalizedResult !== "PENDING")
  ) {
    application.status = "Rejected";
  }

  if (normalizedResult === "PASS") {
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
    await createAuditLog(req, "Application Created", "Application", application._id);
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
        search,
        page,
        limit,
      } = req.query;

      let filter = {};
      const shouldPaginate = page !== undefined || limit !== undefined;
      const currentPage = Math.max(Number(page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 500);

      if (status) {
        filter.status = status;
      }

      if (companyId) {
        filter.companyId =
          companyId;
      }

      if (search) {
        const [students, companies] = await Promise.all([
          Student.find({
            $or: [
              { name: { $regex: search, $options: "i" } },
              { usn: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }).select("_id"),
          Company.find({
            $or: [
              { companyName: { $regex: search, $options: "i" } },
              { location: { $regex: search, $options: "i" } },
            ],
          }).select("_id"),
        ]);

        filter.$or = [
          { status: { $regex: search, $options: "i" } },
          { studentId: { $in: students.map((student) => student._id) } },
          { companyId: { $in: companies.map((company) => company._id) } },
        ];
      }

      const applicationQuery = Application.find(filter)
        .sort({ createdAt: -1 })
        .populate("studentId")
        .populate("companyId");

      if (shouldPaginate) {
        applicationQuery.skip((currentPage - 1) * pageSize).limit(pageSize);
      }

      const [applications, totalRecords] = await Promise.all([
        applicationQuery,
        Application.countDocuments(filter),
      ]);

      res.json({
        success: true,
        applications,
        data: applications,
        currentPage,
        totalPages: shouldPaginate ? Math.ceil(totalRecords / pageSize) : 1,
        totalRecords,
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
        attendanceStatus,
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
        attendanceStatus,
      });

      res.json({
        success: true,
        application,
      });
      await createAuditLog(req, "Application Updated", "Application", application._id);
    } catch (error) {
      res.status(error.status || 500).json({
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
      await createAuditLog(req, "Application Updated", "Application", application._id);
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

const bulkPassApplications = async (req, res) => {
  try {
    const { applicationIds = [] } = req.body;
    let affectedCount = 0;

    const applications = await Application.find({
      _id: { $in: applicationIds },
    });

    for (const application of applications) {
      const rounds = await InterviewRound.find({
        companyId: application.companyId,
      }).sort({ sequence: 1 });
      const round =
        rounds[Math.max(0, application.currentRound - 1)] ||
        rounds[rounds.length - 1];

      await applyRoundResult(application, {
        roundId: round?._id,
        attended: true,
        result: "PASS",
      });
      affectedCount += 1;
    }

    res.json({ success: true, affectedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkRejectApplications = async (req, res) => {
  try {
    const { applicationIds = [] } = req.body;
    let affectedCount = 0;
    const applications = await Application.find({
      _id: { $in: applicationIds },
    });

    for (const application of applications) {
      const rounds = await InterviewRound.find({
        companyId: application.companyId,
      }).sort({ sequence: 1 });
      const round =
        rounds[Math.max(0, application.currentRound - 1)] ||
        rounds[rounds.length - 1];

      await applyRoundResult(application, {
        roundId: round?._id,
        attended: true,
        result: "FAIL",
      });
      affectedCount += 1;
    }

    res.json({ success: true, affectedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkOfferApplications = async (req, res) => {
  try {
    const { applicationIds = [] } = req.body;
    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status: "Offer Received" } }
    );

    res.json({
      success: true,
      affectedCount: result.modifiedCount,
    });
    await createAuditLog(req, "Offer Assigned", "Application", null, {
      affectedCount: result.modifiedCount,
      applicationIds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkDeleteApplications = async (req, res) => {
  try {
    const { applicationIds = [] } = req.body;
    const result = await Application.deleteMany({
      _id: { $in: applicationIds },
    });

    res.json({
      success: true,
      affectedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
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
      await createAuditLog(req, "Offer Assigned", "Application", application._id);
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
      const application = await Application.findByIdAndDelete(
        req.params.id
      );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      res.json({
        success: true,
        message:
          "Application deleted",
      });
      await createAuditLog(req, "Application Deleted", "Application", application._id);
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
  bulkPassApplications,
  bulkRejectApplications,
  bulkOfferApplications,
  bulkDeleteApplications,
};
