const InterviewRound = require(
  "../models/InterviewRound"
);

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

module.exports = {
  createRound,
  getRoundsByCompany,
  updateRound,
  deleteRound,
};