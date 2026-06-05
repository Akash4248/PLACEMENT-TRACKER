const InterviewRound = require(
  "../models/InterviewRound"
);
const Application = require("../models/Application");
const createAuditLog = require("../utils/audit");

const getAttendanceStatus = (roundResult) => {
  if (!roundResult) return "Not Marked";
  if (roundResult.attendanceStatus) return roundResult.attendanceStatus;
  if (roundResult.attended === false && roundResult.result === "FAIL") return "Absent";
  return roundResult.attended ? "Present" : "Not Marked";
};

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
    res.status(error.status || 500).json({
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
    res.status(error.status || 500).json({
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
    res.status(error.status || 500).json({
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
        attendanceStatus: getAttendanceStatus(roundResult),
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

    if (action === "pass" && getAttendanceStatus(existing) === "Absent") {
      const error = new Error("Absent candidates cannot be marked PASS. Mark attendance Present first.");
      error.status = 400;
      throw error;
    }

    const result =
      action === "pass" ? "PASS" : "FAIL";
    const attendanceStatus = action === "absent" ? "Absent" : "Present";
    const attended = attendanceStatus === "Present";

    if (existing) {
      existing.result = result;
      existing.attended = attended;
      existing.attendanceStatus = attendanceStatus;
    } else {
      application.rounds.push({
        roundId: round._id,
        attended,
        attendanceStatus,
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

const resolveAttendanceApplications = async (round, body) => {
  const studentIds = body.studentIds || [];
  const applicationIds = body.applicationIds || [];
  const filter = {
    companyId: round.companyId,
  };

  if (studentIds.length) {
    filter.studentId = { $in: studentIds };
  } else {
    filter._id = { $in: applicationIds };
  }

  if (!studentIds.length && !applicationIds.length) return [];

  return Application.find(filter);
};

const applyAttendanceAction = async (req, attendanceStatus) => {
  const round = await InterviewRound.findById(req.params.roundId);

  if (!round) {
    const error = new Error("Round not found");
    error.status = 404;
    throw error;
  }

  const applications = await resolveAttendanceApplications(round, req.body);

  for (const application of applications) {
    let roundEntry = application.rounds.find(
      (item) => String(item.roundId) === String(round._id)
    );

    if (!roundEntry) {
      application.rounds.push({
        roundId: round._id,
        attended: false,
        attendanceStatus: "Not Marked",
        result: "PENDING",
      });
      roundEntry = application.rounds[application.rounds.length - 1];
    }

    roundEntry.attendanceStatus = attendanceStatus;
    roundEntry.attended = attendanceStatus === "Present";

    if (attendanceStatus === "Absent") {
      roundEntry.result = "FAIL";
      application.status = "Rejected";
      application.currentRound = round.sequence;
    }

    if (attendanceStatus === "Not Marked") {
      roundEntry.result = "PENDING";
      roundEntry.attended = false;
    }

    await application.save();
  }

  return applications.length;
};

const markAttendancePresent = async (req, res) => {
  try {
    const updated = await applyAttendanceAction(req, "Present");
    await createAuditLog(req, "Attendance Marked Present", "InterviewRound", req.params.roundId, {
      updated,
    });
    res.json({ success: true, updated });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAttendanceAbsent = async (req, res) => {
  try {
    const updated = await applyAttendanceAction(req, "Absent");
    await createAuditLog(req, "Attendance Marked Absent", "InterviewRound", req.params.roundId, {
      updated,
    });
    res.json({ success: true, updated });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearAttendance = async (req, res) => {
  try {
    const updated = await applyAttendanceAction(req, "Not Marked");
    await createAuditLog(req, "Attendance Cleared", "InterviewRound", req.params.roundId, {
      updated,
    });
    res.json({ success: true, updated });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAttendanceAnalyticsByCompany = async (req, res) => {
  try {
    const rounds = await InterviewRound.find({
      companyId: req.params.companyId,
    }).sort({ sequence: 1 });
    const applications = await Application.find({
      companyId: req.params.companyId,
    });

    const analytics = rounds.map((round) => {
      const entries = applications
        .map((application) =>
          application.rounds.find((item) => String(item.roundId) === String(round._id))
        )
        .filter(Boolean);
      const present = entries.filter((entry) => getAttendanceStatus(entry) === "Present").length;
      const absent = entries.filter((entry) => getAttendanceStatus(entry) === "Absent").length;
      const total = present + absent;

      return {
        _id: round._id,
        roundName: round.roundName,
        total,
        present,
        absent,
        attendanceRate: total ? Math.round((present / total) * 100) : 0,
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
  markAttendancePresent,
  markAttendanceAbsent,
  clearAttendance,
  getAttendanceAnalyticsByCompany,
};
