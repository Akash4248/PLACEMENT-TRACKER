const Application = require(
  "../models/Application"
);

const InterviewRound = require(
  "../models/InterviewRound"
);

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

      application.status =
        "In Process";

      application.rounds.push({
        roundId,
        attended,
        result,
      });

      if (
        result === "FAIL" ||
        attended === false
      ) {
        application.status =
          "Rejected";
      }

      if (result === "PASS") {
        application.currentRound += 1;

        const totalRounds =
          await InterviewRound.countDocuments(
            {
              companyId:
                application.companyId,
            }
          );

        if (
          application.currentRound >
          totalRounds
        ) {
          application.status =
            "Selected";
        }
      }

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
};
