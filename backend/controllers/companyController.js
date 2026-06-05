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

const getCompanyFunnel = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const rounds = await require("../models/InterviewRound")
      .find({ companyId: company._id })
      .sort({ sequence: 1 });
    const applications = await require("../models/Application").find({
      companyId: company._id,
    });

    const reachedRound = (application, round) =>
      application.currentRound >= round.sequence ||
      application.rounds.some(
        (item) =>
          String(item.roundId) === String(round._id)
      );

    const funnel = {
      applied: applications.length,
      aptitude: 0,
      coding: 0,
      technical: 0,
      hr: 0,
      selected: applications.filter(
        (application) =>
          application.status === "Selected" ||
          application.status === "Offer Received"
      ).length,
    };

    rounds.forEach((round) => {
      const key = round.roundName
        .toLowerCase()
        .replace(/\s+/g, "");

      if (Object.hasOwn(funnel, key)) {
        funnel[key] = applications.filter(
          (application) =>
            reachedRound(application, round)
        ).length;
      }
    });

    res.json({ success: true, funnel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompanyAnalytics = async (req, res) => {
  try {
    const Application = require("../models/Application");
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const applications = await Application.find({
      companyId: company._id,
    }).populate("studentId");
    const applicants = applications.length;
    const selected = applications.filter(
      (application) =>
        application.status === "Selected"
    ).length;
    const rejected = applications.filter(
      (application) =>
        application.status === "Rejected"
    ).length;
    const offers = applications.filter(
      (application) =>
        application.status === "Offer Received"
    ).length;
    const departmentMap = new Map();

    applications.forEach((application) => {
      const department =
        application.studentId?.department ||
        "Unknown";
      const current =
        departmentMap.get(department) || {
          department,
          applicants: 0,
          selected: 0,
          selectionRate: 0,
        };

      current.applicants += 1;

      if (
        application.status === "Selected" ||
        application.status === "Offer Received"
      ) {
        current.selected += 1;
      }

      departmentMap.set(department, current);
    });

    const departmentBreakdown = Array.from(
      departmentMap.values()
    ).map((item) => ({
      ...item,
      selectionRate: item.applicants
        ? Math.round(
            (item.selected / item.applicants) * 100
          )
        : 0,
    }));

    res.json({
      success: true,
      company,
      metrics: {
        applicants,
        selected,
        rejected,
        offers,
        selectionRate: applicants
          ? Math.round(
              ((selected + offers) / applicants) *
                100
            )
          : 0,
      },
      departmentBreakdown,
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
  getCompanyFunnel,
  getCompanyAnalytics,
};
