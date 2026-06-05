const express = require("express");

const router = express.Router();

const {
  createApplication,
  getApplications,
  updateRoundResult,
  getApplication,
  markOfferReceived,
  deleteApplication,
  bulkUploadResults,
} = require("../controllers/applicationController");
const upload = require("../middleware/uploadMiddleware");
const {
  enforcePlacementRules,
} = require("../middleware/placementRulesMiddleware");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post(
  "/",
  enforcePlacementRules,
  createApplication
);

router.get("/", getApplications);

router.post(
  "/bulk-results",
  upload.single("file"),
  bulkUploadResults
);

router.put(
  "/:id/result",
  updateRoundResult
);

router.get("/:id", getApplication);
router.put(
  "/:id/offer",
  markOfferReceived
);
router.delete(
  "/:id",
  deleteApplication
);

module.exports = router;
