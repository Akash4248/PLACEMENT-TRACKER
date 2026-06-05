const Company = require("../models/Company");
const Student = require("../models/Student");
const PDFDocument = require("pdfkit");
const createAuditLog = require("../utils/audit");

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
    await createAuditLog(req, "Company Created", "Company", company._id);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const {
      search,
      page,
      limit,
      status,
      minPackage,
      maxPackage,
      eligibilityCGPA,
    } = req.query;
    const shouldPaginate = page !== undefined || limit !== undefined;
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 500);
    const filter = {};

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (minPackage || maxPackage) {
      filter.package = {};
      if (minPackage) filter.package.$gte = Number(minPackage);
      if (maxPackage) filter.package.$lte = Number(maxPackage);
    }
    if (eligibilityCGPA) {
      filter.minimumCGPA = { $lte: Number(eligibilityCGPA) };
    }

    const companyQuery = Company.find(filter).sort({
      driveDate: 1,
      companyName: 1,
    });

    if (shouldPaginate) {
      companyQuery.skip((currentPage - 1) * pageSize).limit(pageSize);
    }

    const [companies, totalRecords] = await Promise.all([
      companyQuery,
      Company.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: companies.length,
      companies,
      data: companies,
      currentPage,
      totalPages: shouldPaginate ? Math.ceil(totalRecords / pageSize) : 1,
      totalRecords,
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
    await createAuditLog(req, "Company Updated", "Company", company._id);
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

  if (typeof next.allowedGraduationYears === "string") {
    next.allowedGraduationYears =
      next.allowedGraduationYears
        .split(",")
        .map((year) => Number(year.trim()))
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
    const allowedGraduationYears =
      company.allowedGraduationYears || [];
    const departmentFilter =
      allowedDepartments.length > 0
        ? {
            department: {
              $in: allowedDepartments,
            },
          }
        : {};
    const graduationYearFilter =
      allowedGraduationYears.length > 0
        ? {
            graduationYear: {
              $in: allowedGraduationYears,
            },
          }
        : {};

    const students = await Student.find({
      cgpa: { $gte: minimumCGPA },
      ...departmentFilter,
      ...graduationYearFilter,
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
          ...(allowedGraduationYears.length > 0
            ? [
                {
                  graduationYear: {
                    $nin: allowedGraduationYears,
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

const getShortlistData = async (companyId) => {
  const company = await Company.findById(companyId);

  if (!company) {
    const error = new Error("Company not found");
    error.status = 404;
    throw error;
  }

  const minimumCGPA =
    company.minimumCGPA ??
    company.eligibilityCGPA ??
    0;
  const allowedDepartments =
    company.allowedDepartments || [];
  const allowedGraduationYears =
    company.allowedGraduationYears || [];
  const allStudents = await Student.find();

  const isEligible = (student) => {
    const cgpaOk = Number(student.cgpa || 0) >= minimumCGPA;
    const departmentOk =
      allowedDepartments.length === 0 ||
      allowedDepartments.includes(student.department);
    const yearOk =
      allowedGraduationYears.length === 0 ||
      allowedGraduationYears.includes(student.graduationYear);

    return cgpaOk && departmentOk && yearOk;
  };

  const eligibleStudents = allStudents.filter(isEligible);
  const resumeSubmitted = eligibleStudents.filter(
    (student) => Boolean(student.resumeUrl)
  );
  const resumeVerified = resumeSubmitted.filter(
    (student) => student.resumeStatus === "Verified"
  );
  const shortlistedStudents = resumeVerified;

  return {
    company,
    summary: {
      totalStudents: allStudents.length,
      eligibleStudents: eligibleStudents.length,
      resumeSubmitted: resumeSubmitted.length,
      resumeVerified: resumeVerified.length,
      shortlistedStudents: shortlistedStudents.length,
    },
    students: shortlistedStudents,
  };
};

const getShortlist = async (req, res) => {
  try {
    const data = await getShortlistData(req.params.id);

    res.json({
      success: true,
      shortlistedCount: data.students.length,
      summary: data.summary,
      students: data.students,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadShortlistPdf = async (req, res) => {
  try {
    const data = await getShortlistData(req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.company.companyName.replace(/\s+/g, "-").toLowerCase()}-shortlist.pdf"`
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);
    doc.fontSize(20).text(`${data.company.companyName} Shortlist Report`);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#64748B").text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();
    doc.fillColor("#0F172A").fontSize(13).text("Shortlist Summary");
    doc.moveDown(0.5);
    Object.entries(data.summary).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key}: ${value}`);
    });
    doc.moveDown();
    doc.fontSize(13).text("Shortlisted Students");
    doc.moveDown(0.5);
    data.students.slice(0, 80).forEach((student, index) => {
      doc
        .fontSize(9)
        .text(
          `${index + 1}. ${student.usn} | ${student.name} | ${student.department} | CGPA ${student.cgpa} | ${student.graduationYear}`
        );
    });
    doc.end();
  } catch (error) {
    res.status(error.status || 500).json({
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
    const InterviewRound = require("../models/InterviewRound");
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
    const rounds = await InterviewRound.find({
      companyId: company._id,
    }).sort({ sequence: 1 });
    const getAttendanceStatus = (roundEntry) => {
      if (!roundEntry) return "Not Marked";
      if (roundEntry.attendanceStatus) return roundEntry.attendanceStatus;
      if (roundEntry.attended === false && roundEntry.result === "FAIL") return "Absent";
      return roundEntry.attended ? "Present" : "Not Marked";
    };
    const attendanceAnalytics = rounds.map((round) => {
      const entries = applications
        .map((application) =>
          application.rounds.find(
            (entry) => String(entry.roundId) === String(round._id)
          )
        )
        .filter(Boolean);
      const present = entries.filter(
        (entry) => getAttendanceStatus(entry) === "Present"
      ).length;
      const absent = entries.filter(
        (entry) => getAttendanceStatus(entry) === "Absent"
      ).length;
      const total = present + absent;

      return {
        _id: round._id,
        roundName: round.roundName,
        total,
        present,
        absent,
        attendanceRate: total ? Math.round((present / total) * 100) : 0,
      };
    });

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
      attendanceAnalytics,
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
    const company = await Company.findByIdAndDelete(
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
      message: "Company deleted",
    });
    await createAuditLog(req, "Company Deleted", "Company", company._id);
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
  getShortlist,
  downloadShortlistPdf,
  getCompanyFunnel,
  getCompanyAnalytics,
};
