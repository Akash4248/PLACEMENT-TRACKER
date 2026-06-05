const express = require("express");

const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const {
  protect,
} = require("../middleware/authMiddleware");
const {
  authorize,
} = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/", getSettings);
router.put("/", authorize("admin"), updateSettings);

module.exports = router;
