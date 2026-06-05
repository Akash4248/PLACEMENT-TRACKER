const mongoose = require("mongoose");

const placementSettingsSchema =
  new mongoose.Schema(
    {
      dreamPackageThreshold: {
        type: Number,
        default: 1200000,
      },
      maxOffersAllowed: {
        type: Number,
        default: 2,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "PlacementSettings",
  placementSettingsSchema
);
