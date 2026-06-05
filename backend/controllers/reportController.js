const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const Application = require("../models/Application");
const Company = require("../models/Company");
const InterviewRound = require("../models/InterviewRound");
const Student = require("../models/Student");

const reportTimestamp = () => new Date().toISOString();

const percent = (numerator, denominator) =>
  denominator ? Math.round((numerator / denominator) * 100) : 0;

const getPlacementAnalyticsData = async () => {
  const [students, companies, applications] = await Promise.all([
    Student.find(),
    Company.find(),
    Application.find().populate("studentId").populate("companyId"),
  ]);

  const selectedApplications = applications.filter(
    (application) =>
      application.status === "Selected" ||
      application.status === "Offer Received"
  );
  const rejectedApplications = applications.filter(
    (application) => application.status === "Rejected"
  );
  const offerApplications = applications.filter(
    (application) => application.status === "Offer Received"
  );

  const departmentMap = new Map();
  students.forEach((student) => {
    const current =
      departmentMap.get(student.department) || {
        department: student.department,
        students: 0,
        applicants: 0,
        selected: 0,
        placementRate: 0,
      };
    current.students += 1;
    departmentMap.set(student.department, current);
  });

  applications.forEach((application) => {
    const department =
      application.studentId?.department || "Unknown";
    const current =
      departmentMap.get(department) || {
        department,
        students: 0,
        applicants: 0,
        selected: 0,
        placementRate: 0,
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

  const departmentAnalytics = Array.from(
    departmentMap.values()
  ).map((item) => ({
    ...item,
    placementRate: percent(item.selected, item.students),
  }));

  const companyAnalytics = companies
    .map((company) => {
      const companyApplications = applications.filter(
        (application) =>
          String(application.companyId?._id) === String(company._id)
      );
      const selected = companyApplications.filter(
        (application) =>
          application.status === "Selected" ||
          application.status === "Offer Received"
      ).length;

      return {
        companyId: company._id,
        companyName: company.companyName,
        package: company.package,
        applicants: companyApplications.length,
        selected,
        rejected: companyApplications.filter(
          (application) => application.status === "Rejected"
        ).length,
        offers: companyApplications.filter(
          (application) => application.status === "Offer Received"
        ).length,
        selectionRate: percent(selected, companyApplications.length),
      };
    })
    .sort((a, b) => b.selected - a.selected);

  const reachedRound = (application, n) =>
    application.rounds.length >= n || application.currentRound > n;
  const funnel = {
    applied: applications.length,
    round1: applications.filter((application) =>
      reachedRound(application, 1)
    ).length,
    round2: applications.filter((application) =>
      reachedRound(application, 2)
    ).length,
    round3: applications.filter((application) =>
      reachedRound(application, 3)
    ).length,
    selected: selectedApplications.length,
  };

  return {
    metadata: {
      reportName: "CampusTrack Placement Analytics",
      generatedAt: reportTimestamp(),
      generatedBy: "CampusTrack Reports Center",
    },
    executiveSummary: {
      totalStudents: students.length,
      totalCompanies: companies.length,
      totalApplications: applications.length,
      selected: selectedApplications.length,
      rejected: rejectedApplications.length,
      offers: offerApplications.length,
      selectionRate: percent(selectedApplications.length, applications.length),
      offerRate: percent(offerApplications.length, applications.length),
    },
    departmentAnalytics,
    companyAnalytics,
    funnel,
  };
};

const drawTitle = (doc, title, subtitle) => {
  doc.fontSize(22).fillColor("#0F172A").text(title, { bold: true });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#64748B").text(subtitle);
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#E2E8F0").stroke();
  doc.moveDown(1);
};

const drawSection = (doc, title) => {
  doc.moveDown(0.8);
  doc.fontSize(14).fillColor("#0F172A").text(title);
  doc.moveDown(0.4);
};

const drawKeyValues = (doc, items) => {
  items.forEach(([label, value]) => {
    doc.fontSize(10).fillColor("#64748B").text(label, { continued: true });
    doc.fillColor("#0F172A").text(`  ${value}`);
  });
};

const drawTable = (doc, headers, rows, widths) => {
  const startX = 50;
  let y = doc.y;
  doc.fontSize(9).fillColor("#0F172A");
  headers.forEach((header, index) => {
    doc.text(header, startX + widths.slice(0, index).reduce((a, b) => a + b, 0), y, {
      width: widths[index],
    });
  });
  y += 18;
  doc.moveTo(startX, y - 4).lineTo(562, y - 4).strokeColor("#E2E8F0").stroke();

  rows.slice(0, 18).forEach((row) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    row.forEach((value, index) => {
      doc.fillColor("#334155").text(String(value), startX + widths.slice(0, index).reduce((a, b) => a + b, 0), y, {
        width: widths[index],
      });
    });
    y += 18;
  });

  doc.y = y + 8;
};

const sendPdf = (res, filename, title, data, sections = {}) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  drawTitle(doc, title, `Generated ${data.metadata.generatedAt}`);
  drawSection(doc, "Executive Summary");
  drawKeyValues(doc, [
    ["Total Students", data.executiveSummary.totalStudents],
    ["Total Companies", data.executiveSummary.totalCompanies],
    ["Applications", data.executiveSummary.totalApplications],
    ["Selected", data.executiveSummary.selected],
    ["Rejected", data.executiveSummary.rejected],
    ["Offers", data.executiveSummary.offers],
    ["Selection Rate", `${data.executiveSummary.selectionRate}%`],
    ["Offer Rate", `${data.executiveSummary.offerRate}%`],
  ]);

  if (sections.department !== false) {
    drawSection(doc, "Department Analytics");
    drawTable(
      doc,
      ["Department", "Students", "Applicants", "Selected", "Rate"],
      data.departmentAnalytics.map((item) => [
        item.department,
        item.students,
        item.applicants,
        item.selected,
        `${item.placementRate}%`,
      ]),
      [110, 85, 85, 85, 80]
    );
  }

  if (sections.company !== false) {
    drawSection(doc, "Company Analytics");
    drawTable(
      doc,
      ["Company", "Applicants", "Selected", "Rejected", "Offers", "Rate"],
      data.companyAnalytics.map((item) => [
        item.companyName,
        item.applicants,
        item.selected,
        item.rejected,
        item.offers,
        `${item.selectionRate}%`,
      ]),
      [150, 75, 75, 75, 65, 60]
    );
  }

  if (sections.funnel !== false) {
    drawSection(doc, "Recruitment Funnel");
    drawKeyValues(doc, [
      ["Applied", data.funnel.applied],
      ["Round 1", data.funnel.round1],
      ["Round 2", data.funnel.round2],
      ["Round 3", data.funnel.round3],
      ["Selected", data.funnel.selected],
    ]);
  }

  drawSection(doc, "Report Metadata");
  drawKeyValues(doc, [
    ["Report Name", data.metadata.reportName],
    ["Generated By", data.metadata.generatedBy],
    ["Generated Timestamp", data.metadata.generatedAt],
  ]);

  doc.end();
};

const addWorksheet = (workbook, name, rows) => {
  const worksheet = workbook.addWorksheet(name);
  if (!rows.length) return worksheet;

  worksheet.columns = Object.keys(rows[0]).map((key) => ({
    header: key,
    key,
    width: Math.max(16, key.length + 4),
  }));
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFF6FF" },
  };
  return worksheet;
};

const sendXlsx = async (res, data) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CampusTrack";
  workbook.created = new Date();

  addWorksheet(
    workbook,
    "Executive Summary",
    Object.entries(data.executiveSummary).map(([metric, value]) => ({
      metric,
      value,
    }))
  );
  addWorksheet(
    workbook,
    "Report Metadata",
    Object.entries(data.metadata).map(([field, value]) => ({
      field,
      value,
    }))
  );
  addWorksheet(workbook, "Department Analytics", data.departmentAnalytics);
  addWorksheet(workbook, "Company Analytics", data.companyAnalytics);
  addWorksheet(workbook, "Recruitment Funnel", [data.funnel]);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="campustrack-placement-analytics.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
};

const placementAnalyticsPdf = async (req, res) => {
  const data = await getPlacementAnalyticsData();
  sendPdf(res, "campustrack-placement-analytics.pdf", "Placement Analytics Report", data);
};

const placementAnalyticsXlsx = async (req, res) => {
  const data = await getPlacementAnalyticsData();
  await sendXlsx(res, data);
};

const companyPdf = async (req, res) => {
  const data = await getPlacementAnalyticsData();
  const company = data.companyAnalytics.find(
    (item) => String(item.companyId) === req.params.companyId
  );

  if (!company) {
    return res.status(404).json({ success: false, message: "Company not found in analytics" });
  }

  const scoped = {
    ...data,
    metadata: { ...data.metadata, reportName: `${company.companyName} Company Report` },
    executiveSummary: {
      ...data.executiveSummary,
      totalCompanies: 1,
      totalApplications: company.applicants,
      selected: company.selected,
      rejected: company.rejected,
      offers: company.offers,
      selectionRate: company.selectionRate,
    },
    companyAnalytics: [company],
  };
  sendPdf(res, `campustrack-${company.companyName.replace(/\s+/g, "-").toLowerCase()}-report.pdf`, `${company.companyName} Report`, scoped);
};

const departmentPdf = async (req, res) => {
  const data = await getPlacementAnalyticsData();
  const departmentName = decodeURIComponent(req.params.department);
  const department = data.departmentAnalytics.find(
    (item) => item.department === departmentName
  );

  if (!department) {
    return res.status(404).json({ success: false, message: "Department not found in analytics" });
  }

  const scoped = {
    ...data,
    metadata: { ...data.metadata, reportName: `${department.department} Department Report` },
    executiveSummary: {
      ...data.executiveSummary,
      totalStudents: department.students,
      totalApplications: department.applicants,
      selected: department.selected,
      selectionRate: department.placementRate,
    },
    departmentAnalytics: [department],
  };
  sendPdf(res, `campustrack-${department.department}-department-report.pdf`, `${department.department} Department Report`, scoped, { company: false });
};

const studentPdf = async (req, res) => {
  const [student, applications] = await Promise.all([
    Student.findById(req.params.studentId),
    Application.find({ studentId: req.params.studentId }).populate("companyId").populate("rounds.roundId"),
  ]);

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  const selected = applications.filter(
    (application) => application.status === "Selected" || application.status === "Offer Received"
  ).length;
  const data = {
    metadata: {
      reportName: `${student.name} Student Placement Report`,
      generatedAt: reportTimestamp(),
      generatedBy: "CampusTrack Reports Center",
    },
    executiveSummary: {
      totalStudents: 1,
      totalCompanies: applications.length,
      totalApplications: applications.length,
      selected,
      rejected: applications.filter((application) => application.status === "Rejected").length,
      offers: applications.filter((application) => application.status === "Offer Received").length,
      selectionRate: percent(selected, applications.length),
      offerRate: percent(applications.filter((application) => application.status === "Offer Received").length, applications.length),
    },
    departmentAnalytics: [
      {
        department: student.department,
        students: 1,
        applicants: applications.length,
        selected,
        placementRate: percent(selected, applications.length),
      },
    ],
    companyAnalytics: applications.map((application) => ({
      companyName: application.companyId?.companyName || "Unknown",
      applicants: 1,
      selected: application.status === "Selected" || application.status === "Offer Received" ? 1 : 0,
      rejected: application.status === "Rejected" ? 1 : 0,
      offers: application.status === "Offer Received" ? 1 : 0,
      selectionRate: application.status === "Selected" || application.status === "Offer Received" ? 100 : 0,
    })),
    funnel: {
      applied: applications.length,
      round1: applications.filter((application) => application.rounds.length >= 1).length,
      round2: applications.filter((application) => application.rounds.length >= 2).length,
      round3: applications.filter((application) => application.rounds.length >= 3).length,
      selected,
    },
  };

  sendPdf(res, `campustrack-${student.usn}-student-report.pdf`, `${student.name} Student Report`, data);
};

const funnelPdf = async (req, res) => {
  const data = await getPlacementAnalyticsData();
  sendPdf(res, "campustrack-recruitment-funnel.pdf", "Recruitment Funnel Report", data, {
    department: false,
    company: false,
  });
};

module.exports = {
  placementAnalyticsPdf,
  placementAnalyticsXlsx,
  companyPdf,
  departmentPdf,
  studentPdf,
  funnelPdf,
};
