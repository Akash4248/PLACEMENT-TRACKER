const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getCompanyAnalytics,
} = require("../controllers/dashboardController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/stats",
  protect,
  getDashboardStats
);

router.get(
  "/company-analytics",
  protect,
  getCompanyAnalytics
);

module.exports = router;
