const PlacementSettings = require("../models/PlacementSettings");
const {
  getPlacementSettings,
} = require("../middleware/placementRulesMiddleware");

const getSettings = async (req, res) => {
  try {
    const settings =
      await getPlacementSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const payload = {
      dreamPackageThreshold: Number(
        req.body.dreamPackageThreshold
      ),
      maxOffersAllowed: Number(
        req.body.maxOffersAllowed
      ),
    };

    const settings =
      await PlacementSettings.findOneAndUpdate(
        {},
        payload,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
