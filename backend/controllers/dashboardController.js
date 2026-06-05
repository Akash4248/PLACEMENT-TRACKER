const Student = require("../models/Student");
const Company = require("../models/Company");
const Application = require("../models/Application");

const normalizeAttendanceStatus = (round) => {
  if (round.attendanceStatus) return round.attendanceStatus;
  if (round.attended === false && round.result === "FAIL") return "Absent";
  return round.attended ? "Present" : "Not Marked";
};

const getDashboardStats = async (
  req,
  res
) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      totalApplications,
      selected,
      rejected,
      inProcess,
      offerReceived,
      applicationsForAttendance,
    ] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({
        status: "Selected",
      }),
      Application.countDocuments({
        status: "Rejected",
      }),
      Application.countDocuments({
        status: "In Process",
      }),
      Application.countDocuments({
        status: "Offer Received",
      }),
      Application.find().select("rounds"),
    ]);
    const attendanceRecords = applicationsForAttendance.flatMap((application) =>
      application.rounds.filter((round) => normalizeAttendanceStatus(round) !== "Not Marked")
    );
    const present = attendanceRecords.filter(
      (round) => normalizeAttendanceStatus(round) === "Present"
    ).length;
    const absent = attendanceRecords.filter(
      (round) => normalizeAttendanceStatus(round) === "Absent"
    ).length;
    const totalAttendanceRecords = present + absent;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalApplications,
        selected,
        rejected,
        inProcess,
        offerReceived,
        attendance: {
          totalCandidates: totalAttendanceRecords,
          present,
          absent,
          attendanceRate: totalAttendanceRecords
            ? Math.round((present / totalAttendanceRecords) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getCompanyAnalytics =
  async (req, res) => {
    try {
      const data =
        await Application.aggregate([
          {
            $group: {
              _id: "$companyId",
              totalApplicants: {
                $sum: 1,
              },
              selected: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "Selected",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: "companies",
              localField: "_id",
              foreignField: "_id",
              as: "company",
            },
          },
          {
            $unwind: {
              path: "$company",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              companyName:
                "$company.companyName",
              selectionRate: {
                $cond: [
                  {
                    $gt: [
                      "$totalApplicants",
                      0,
                    ],
                  },
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$selected",
                              "$totalApplicants",
                            ],
                          },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          {
            $sort: {
              selected: -1,
            },
          },
        ]);

      res.json({
        success: true,
        analytics: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

const getDepartmentAnalytics = async (
  req,
  res
) => {
  try {
    const departments =
      await Student.aggregate([
        {
          $group: {
            _id: "$department",
            students: { $sum: 1 },
          },
        },
      ]);

    const selectedApplications =
      await Application.find({
        status: {
          $in: [
            "Selected",
            "Offer Received",
          ],
        },
      }).populate("studentId");

    const selectedByDepartment =
      selectedApplications.reduce(
        (acc, application) => {
          const department =
            application.studentId
              ?.department || "Unknown";
          acc[department] =
            (acc[department] || 0) + 1;
          return acc;
        },
        {}
      );

    const analytics = departments.map(
      (item) => {
        const selected =
          selectedByDepartment[item._id] || 0;
        return {
          department: item._id,
          students: item.students,
          selected,
          placementRate: item.students
            ? Math.round(
                (selected /
                  item.students) *
                  100
              )
            : 0,
        };
      }
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRecruitmentFunnel = async (
  req,
  res
) => {
  try {
    const applications =
      await Application.find();

    const reachedRound = (application, n) =>
      application.rounds.length >= n ||
      application.currentRound > n;

    res.json({
      success: true,
      funnel: {
        applied: applications.length,
        round1: applications.filter(
          (application) =>
            reachedRound(application, 1)
        ).length,
        round2: applications.filter(
          (application) =>
            reachedRound(application, 2)
        ).length,
        round3: applications.filter(
          (application) =>
            reachedRound(application, 3)
        ).length,
        selected: applications.filter(
          (application) =>
            application.status ===
              "Selected" ||
            application.status ===
              "Offer Received"
        ).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAttendanceAnalytics = async (req, res) => {
  try {
    const applications = await Application.find().select("rounds");
    const attendanceRecords = applications.flatMap((application) =>
      application.rounds.filter((round) => normalizeAttendanceStatus(round) !== "Not Marked")
    );
    const present = attendanceRecords.filter(
      (round) => normalizeAttendanceStatus(round) === "Present"
    ).length;
    const absent = attendanceRecords.filter(
      (round) => normalizeAttendanceStatus(round) === "Absent"
    ).length;
    const totalCandidates = present + absent;

    res.json({
      success: true,
      attendance: {
        totalCandidates,
        present,
        absent,
        attendanceRate: totalCandidates
          ? Math.round((present / totalCandidates) * 100)
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

  
module.exports = {
  getDashboardStats,
  getCompanyAnalytics,
  getDepartmentAnalytics,
  getRecruitmentFunnel,
  getAttendanceAnalytics,
};
