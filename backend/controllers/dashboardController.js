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

  
module.exports = {
  getDashboardStats,
  getCompanyAnalytics,
};