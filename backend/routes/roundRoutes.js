const express = require("express");

const router = express.Router();

const {
  createRound,
  getRoundsByCompany,
  updateRound,
  deleteRound,
  getRoundAnalyticsByCompany,
  getRoundApplications,
  bulkPassRound,
  bulkRejectRound,
  bulkAbsentRound,
} = require("../controllers/roundController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createRound);

router.get(
  "/company/:companyId/analytics",
  getRoundAnalyticsByCompany
);

router.get(
  "/company/:companyId",
  getRoundsByCompany
);

router.get(
  "/:roundId/applications",
  getRoundApplications
);

router.post("/:roundId/bulk-pass", bulkPassRound);
router.post("/:roundId/bulk-reject", bulkRejectRound);
router.post("/:roundId/bulk-absent", bulkAbsentRound);

router.put("/:id", updateRound);

router.delete("/:id", deleteRound);

module.exports = router;
