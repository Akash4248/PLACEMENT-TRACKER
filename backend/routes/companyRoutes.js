const express = require("express");

const router = express.Router();
const {
  authorize,
} = require("../middleware/roleMiddleware");

const {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getEligibleStudents,
} = require("../controllers/companyController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createCompany);
router.get("/", getCompanies);
router.get(
  "/:id/eligible-students",
  getEligibleStudents
);
router.get("/:id", getCompany);
router.put("/:id", updateCompany);
router.delete(
  "/:id",
  authorize("admin"),
  deleteCompany
);

module.exports = router;
