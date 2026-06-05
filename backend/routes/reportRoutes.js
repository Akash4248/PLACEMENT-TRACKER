const express = require("express");

const router = express.Router();

const {
  companyPdf,
  departmentPdf,
  funnelPdf,
  placementAnalyticsPdf,
  placementAnalyticsXlsx,
  studentPdf,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/placement-analytics/pdf", placementAnalyticsPdf);
router.get("/placement-analytics/xlsx", placementAnalyticsXlsx);
router.get("/company/:companyId/pdf", companyPdf);
router.get("/department/:department/pdf", departmentPdf);
router.get("/student/:studentId/pdf", studentPdf);
router.get("/funnel/pdf", funnelPdf);

module.exports = router;
