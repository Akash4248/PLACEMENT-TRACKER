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
  const [students, companies, applications, rounds] = await Promise.all([
    Student.find(),
    Company.find(),
    Application.find().populate("studentId").populate("companyId"),
    InterviewRound.find().populate("companyId").sort({ sequence: 1 }),
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

  const getAttendanceStatus = (roundEntry) => {
    if (roundEntry.attendanceStatus) return roundEntry.attendanceStatus;
    if (roundEntry.attended === false && roundEntry.result === "FAIL") return "Absent";
    return roundEntry.attended ? "Present" : "Not Marked";
  };
  const attendanceEntries = applications.flatMap((application) =>
    (application.rounds || [])
      .filter((roundEntry) => getAttendanceStatus(roundEntry) !== "Not Marked")
      .map((roundEntry) => {
        const plainEntry = roundEntry.toObject?.() || roundEntry;
        return {
          ...plainEntry,
          companyId: application.companyId?._id,
        };
      })
  );
  const attendancePresent = attendanceEntries.filter(
    (entry) => getAttendanceStatus(entry) === "Present"
  ).length;
  const attendanceAbsent = attendanceEntries.filter(
    (entry) => getAttendanceStatus(entry) === "Absent"
  ).length;
  const attendanceTotal = attendancePresent + attendanceAbsent;
  const attendanceAnalytics = rounds.map((round) => {
    const roundEntries = attendanceEntries.filter(
      (entry) => String(entry.roundId) === String(round._id)
    );
    const present = roundEntries.filter(
      (entry) => getAttendanceStatus(entry) === "Present"
    ).length;
    const absent = roundEntries.filter(
      (entry) => getAttendanceStatus(entry) === "Absent"
    ).length;
    const total = present + absent;

    return {
      companyName: round.companyId?.companyName || "Unknown",
      roundName: round.roundName,
      total,
      present,
      absent,
      attendanceRate: percent(present, total),
    };
  });

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
      attendanceRecords: attendanceTotal,
      present: attendancePresent,
      absent: attendanceAbsent,
      attendanceRate: percent(attendancePresent, attendanceTotal),
    },
    departmentAnalytics,
    companyAnalytics,
    attendanceAnalytics,
    funnel,
  };
};

const page = {
  margin: 44,
  width: 507,
  bottom: 790,
};

const addPageIfNeeded = (doc, neededHeight = 40) => {
  if (doc.y + neededHeight > page.bottom) {
    doc.addPage();
    doc.y = page.margin;
  }
};

const drawTitle = (doc, title, subtitle) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0F172A")
    .text(title, page.margin, page.margin, {
      width: page.width,
      align: "left",
    });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(subtitle, {
    width: page.width,
  });
  doc.moveDown(0.9);
  doc
    .moveTo(page.margin, doc.y)
    .lineTo(page.margin + page.width, doc.y)
    .strokeColor("#CBD5E1")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.9);
};

const drawSection = (doc, title) => {
  addPageIfNeeded(doc, 48);
  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0F172A").text(title, {
    width: page.width,
  });
  doc.moveDown(0.45);
};

const drawKeyValueGrid = (doc, items, columns = 4) => {
  const gap = 8;
  const rowGap = 8;
  const cardWidth = (page.width - gap * (columns - 1)) / columns;
  const cardHeight = 48;

  items.forEach(([label, value], index) => {
    if (index % columns === 0) {
      addPageIfNeeded(doc, cardHeight + rowGap);
    }

    const column = index % columns;
    const x = page.margin + column * (cardWidth + gap);
    const y = doc.y;

    doc
      .roundedRect(x, y, cardWidth, cardHeight, 6)
      .fillAndStroke("#F8FAFC", "#E2E8F0");
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#64748B")
      .text(String(label).toUpperCase(), x + 9, y + 9, {
        width: cardWidth - 18,
        ellipsis: true,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#0F172A")
      .text(String(value), x + 9, y + 25, {
        width: cardWidth - 18,
        ellipsis: true,
      });

    if (column === columns - 1 || index === items.length - 1) {
      doc.y = y + cardHeight + rowGap;
    }
  });
};

const normalizeTableRows = (rows) =>
  rows.map((row) => row.map((value) => (value === undefined || value === null ? "-" : String(value))));

const drawTableHeader = (doc, headers, widths, x, y) => {
  const headerHeight = 24;

  doc.rect(x, y, page.width, headerHeight).fill("#EFF6FF");
  doc.strokeColor("#BFDBFE").lineWidth(0.7).rect(x, y, page.width, headerHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#1E3A8A");

  let cursorX = x;
  headers.forEach((header, index) => {
    doc.text(header, cursorX + 6, y + 7, {
      width: widths[index] - 12,
      height: headerHeight - 10,
      ellipsis: true,
    });
    cursorX += widths[index];
  });

  return y + headerHeight;
};

const drawTable = (doc, headers, rows, widths, options = {}) => {
  const tableRows = normalizeTableRows(rows).slice(0, options.limit || 80);
  const x = page.margin;
  const rowPaddingX = 6;
  const rowPaddingY = 7;
  const minRowHeight = 25;
  let y = doc.y;

  if (!tableRows.length) {
    addPageIfNeeded(doc, 32);
    doc
      .roundedRect(x, y, page.width, 32, 6)
      .fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("No records available", x + 10, y + 11);
    doc.y = y + 42;
    return;
  }

  addPageIfNeeded(doc, 56);
  y = drawTableHeader(doc, headers, widths, x, y);

  tableRows.forEach((row, rowIndex) => {
    doc.font("Helvetica").fontSize(8);
    const rowHeights = row.map((value, columnIndex) =>
      doc.heightOfString(value, {
        width: widths[columnIndex] - rowPaddingX * 2,
      }) +
      rowPaddingY * 2
    );
    const rowHeight = Math.max(minRowHeight, ...rowHeights);

    if (y + rowHeight > page.bottom) {
      doc.addPage();
      y = drawTableHeader(doc, headers, widths, x, page.margin);
    }

    doc
      .rect(x, y, page.width, rowHeight)
      .fill(rowIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFC");
    doc
      .strokeColor("#E2E8F0")
      .lineWidth(0.5)
      .rect(x, y, page.width, rowHeight)
      .stroke();

    let cursorX = x;
    row.forEach((value, columnIndex) => {
      if (columnIndex > 0) {
        doc
          .moveTo(cursorX, y)
          .lineTo(cursorX, y + rowHeight)
          .strokeColor("#E2E8F0")
          .lineWidth(0.5)
          .stroke();
      }

      doc.font("Helvetica").fontSize(8).fillColor("#334155").text(value, cursorX + rowPaddingX, y + rowPaddingY, {
        width: widths[columnIndex] - rowPaddingX * 2,
        height: rowHeight - rowPaddingY * 2,
        ellipsis: true,
      });
      cursorX += widths[columnIndex];
    });

    y += rowHeight;
  });

  doc.y = y + 12;
};

const sendPdf = (res, filename, title, data, sections = {}) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: page.margin, size: "A4" });
  doc.pipe(res);

  drawTitle(doc, title, `Generated ${data.metadata.generatedAt}`);
  drawSection(doc, "Executive Summary");
  drawKeyValueGrid(doc, [
    ["Total Students", data.executiveSummary.totalStudents],
    ["Total Companies", data.executiveSummary.totalCompanies],
    ["Applications", data.executiveSummary.totalApplications],
    ["Selected", data.executiveSummary.selected],
    ["Rejected", data.executiveSummary.rejected],
    ["Offers", data.executiveSummary.offers],
    ["Selection Rate", `${data.executiveSummary.selectionRate}%`],
    ["Offer Rate", `${data.executiveSummary.offerRate}%`],
    ["Attendance Rate", `${data.executiveSummary.attendanceRate || 0}%`],
    ["Present", data.executiveSummary.present || 0],
    ["Absent", data.executiveSummary.absent || 0],
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
      [155, 88, 88, 88, 88]
    );
  }

  if (sections.company !== false) {
    drawSection(doc, "Company Analytics");
    drawTable(
      doc,
      ["Company", "Package", "Applicants", "Selected", "Rejected", "Offers", "Rate"],
      data.companyAnalytics.map((item) => [
        item.companyName,
        item.package ? `${item.package} LPA` : "-",
        item.applicants,
        item.selected,
        item.rejected,
        item.offers,
        `${item.selectionRate}%`,
      ]),
      [145, 70, 64, 64, 64, 50, 50]
    );
  }

  if (sections.funnel !== false) {
    drawSection(doc, "Recruitment Funnel");
    drawTable(
      doc,
      ["Stage", "Candidates"],
      [
        ["Applied", data.funnel.applied],
        ["Round 1", data.funnel.round1],
        ["Round 2", data.funnel.round2],
        ["Round 3", data.funnel.round3],
        ["Selected", data.funnel.selected],
      ],
      [360, 147],
      { limit: 10 }
    );
  }

  if (sections.attendance !== false) {
    drawSection(doc, "Round Attendance Analytics");
    drawTable(
      doc,
      ["Company", "Round", "Total", "Present", "Absent", "Rate"],
      (data.attendanceAnalytics || []).map((item) => [
        item.companyName,
        item.roundName,
        item.total,
        item.present,
        item.absent,
        `${item.attendanceRate}%`,
      ]),
      [142, 116, 58, 65, 65, 56]
    );
  }

  drawSection(doc, "Report Metadata");
  drawTable(
    doc,
    ["Field", "Value"],
    [
      ["Report Name", data.metadata.reportName],
      ["Generated By", data.metadata.generatedBy],
      ["Generated Timestamp", data.metadata.generatedAt],
    ],
    [160, 347],
    { limit: 10 }
  );

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
  addWorksheet(workbook, "Attendance Analytics", data.attendanceAnalytics || []);
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
