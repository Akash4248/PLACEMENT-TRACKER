const Application = require("../models/Application");
const Company = require("../models/Company");
const PlacementSettings = require("../models/PlacementSettings");

const toAnnualPackage = (value) => {
  const amount = Number(value || 0);

  if (amount > 0 && amount < 1000) {
    return amount * 100000;
  }

  return amount;
};

const getPlacementSettings = async () => {
  const settings =
    await PlacementSettings.findOne().sort({
      createdAt: -1,
    });

  return (
    settings || {
      dreamPackageThreshold: 1200000,
      maxOffersAllowed: 2,
    }
  );
};

const enforcePlacementRules = async (
  req,
  res,
  next
) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return next();
    }

    const settings =
      await getPlacementSettings();

    const offers = await Application.find({
      studentId,
      status: "Offer Received",
    }).populate("companyId");

    if (
      offers.length >= settings.maxOffersAllowed
    ) {
      return res.status(400).json({
        success: false,
        message: `Student already has the maximum allowed offers (${settings.maxOffersAllowed}).`,
      });
    }

    const dreamOffer = offers.find(
      (application) =>
        toAnnualPackage(
          application.companyId?.package
        ) >= settings.dreamPackageThreshold
    );

    if (dreamOffer) {
      return res.status(400).json({
        success: false,
        message:
          "Student already has a dream offer and cannot apply to more companies.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  enforcePlacementRules,
  getPlacementSettings,
  toAnnualPackage,
};
