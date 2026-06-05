const Student = require("../models/Student");
const Company = require("../models/Company");
const Application = require("../models/Application");

const getDashboardStats = async (
  req,
  res
) => {
  try {
    const totalStudents =
      await Student.countDocuments();

    const totalCompanies =
      await Company.countDocuments();

    const totalApplications =
      await Application.countDocuments();

    const selected =
      await Application.countDocuments({
        status: "Selected",
      });

    const rejected =
      await Application.countDocuments({
        status: "Rejected",
      });

    const inProcess =
      await Application.countDocuments({
        status: "In Process",
      });

    const offerReceived =
      await Application.countDocuments({
        status: "Offer Received",
      });

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

  
module.exports = {
  getDashboardStats,
  getCompanyAnalytics,
  getDepartmentAnalytics,
  getRecruitmentFunnel,
};
