const Company = require("../models/Company");
const Student = require("../models/Student");

const createCompany = async (req, res) => {
  try {
    const payload = normalizeCompanyPayload(
      req.body
    );
    const company = await Company.create(payload);

    res.status(201).json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();

    res.json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(
      req.params.id
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCompany = async (req, res) => {
  try {
    const payload = normalizeCompanyPayload(
      req.body
    );
    const company =
      await Company.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true }
      );

    res.json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const normalizeCompanyPayload = (payload) => {
  const next = { ...payload };

  if (
    next.minimumCGPA === undefined &&
    next.eligibilityCGPA !== undefined
  ) {
    next.minimumCGPA = next.eligibilityCGPA;
  }

  if (typeof next.allowedDepartments === "string") {
    next.allowedDepartments =
      next.allowedDepartments
        .split(",")
        .map((department) =>
          department.trim()
        )
        .filter(Boolean);
  }

  return next;
};

const getEligibleStudents = async (
  req,
  res
) => {
  try {
    const company = await Company.findById(
      req.params.id
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const minimumCGPA =
      company.minimumCGPA ??
      company.eligibilityCGPA ??
      0;
    const allowedDepartments =
      company.allowedDepartments || [];
    const departmentFilter =
      allowedDepartments.length > 0
        ? {
            department: {
              $in: allowedDepartments,
            },
          }
        : {};

    const students = await Student.find({
      cgpa: { $gte: minimumCGPA },
      ...departmentFilter,
    });

    const notEligibleStudents =
      await Student.find({
        $or: [
          { cgpa: { $lt: minimumCGPA } },
          ...(allowedDepartments.length > 0
            ? [
                {
                  department: {
                    $nin: allowedDepartments,
                  },
                },
              ]
            : []),
        ],
      });

    res.json({
      success: true,
      eligibleCount: students.length,
      students,
      notEligibleCount:
        notEligibleStudents.length,
      notEligibleStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Company deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getEligibleStudents,
};
