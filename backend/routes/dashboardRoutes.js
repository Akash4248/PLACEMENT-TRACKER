const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getCompanyAnalytics,
  getDepartmentAnalytics,
  getRecruitmentFunnel,
  getAttendanceAnalytics,
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

router.get(
  "/department-analytics",
  protect,
  getDepartmentAnalytics
);

router.get(
  "/funnel",
  protect,
  getRecruitmentFunnel
);

router.get(
  "/attendance",
  protect,
  getAttendanceAnalytics
);

module.exports = router;
