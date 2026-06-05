const express = require("express");

const router = express.Router();

const {
  createApplication,
  getApplications,
  updateRoundResult,
  getApplication,
  markOfferReceived,
  deleteApplication,
} = require("../controllers/applicationController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createApplication);

router.get("/", getApplications);

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
