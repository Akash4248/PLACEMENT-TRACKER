const express = require("express");

const router = express.Router();

const {
  createRound,
  getRoundsByCompany,
  updateRound,
  deleteRound,
} = require("../controllers/roundController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createRound);

router.get(
  "/company/:companyId",
  getRoundsByCompany
);

router.put("/:id", updateRound);

router.delete("/:id", deleteRound);

module.exports = router;