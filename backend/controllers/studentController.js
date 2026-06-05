const Student = require("../models/Student");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { parseSpreadsheet } = require("../utils/fileParser");
const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");
const createAuditLog = require("../utils/audit");

const getProfileStrength = (student) => {
  const checks = [
    student.name,
    student.email,
    student.phone,
    student.department,
    student.cgpa !== undefined && student.cgpa !== null,
    student.graduationYear,
    student.resumeUrl,
  ];
  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
};

const getPublicBaseUrl = (req) =>
  process.env.BACKEND_PUBLIC_URL ||
  `${req.protocol}://${req.get("host")}`;

const getResumeContentType = (fileName = "") => {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf") return "application/pdf";
  if (extension === ".doc") return "application/msword";
  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
};

const getLocalResumePath = (resumeUrl = "") => {
  const marker = "/uploads/resumes/";
  const markerIndex = resumeUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const fileName = decodeURIComponent(resumeUrl.slice(markerIndex + marker.length));
  const safeFileName = path.basename(fileName);
  return path.join(__dirname, "..", "uploads", "resumes", safeFileName);
};

const withProfileStrength = (student) => ({
  ...student.toObject(),
  profileStrength: getProfileStrength(student),
});

const createStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.create(req.body);
    await createAuditLog(req, "Student Created", "Student", student._id);

    res.status(201).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStudents = async (
  req,
  res
) => {
  try {
    const {
      search,
      page,
      limit,
      department,
      graduationYear,
      minCGPA,
      maxCGPA,
      resumeStatus,
    } = req.query;
    const shouldPaginate = page !== undefined || limit !== undefined;
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 500);

    let query = {};

    if (search) {
      query = {
        $or: [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            usn: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
          {
            department: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      };
    }

    if (department) query.department = department;
    if (graduationYear) query.graduationYear = Number(graduationYear);
    if (resumeStatus) query.resumeStatus = resumeStatus;
    if (minCGPA || maxCGPA) {
      query.cgpa = {};
      if (minCGPA) query.cgpa.$gte = Number(minCGPA);
      if (maxCGPA) query.cgpa.$lte = Number(maxCGPA);
    }

    const studentQuery = Student.find(query).sort({ createdAt: -1, name: 1 });

    if (shouldPaginate) {
      studentQuery.skip((currentPage - 1) * pageSize).limit(pageSize);
    }

    const [students, totalRecords] = await Promise.all([
      studentQuery,
      Student.countDocuments(query),
    ]);
    const mappedStudents = students.map(withProfileStrength);

    res.json({
      success: true,
      count: mappedStudents.length,
      students: mappedStudents,
      data: mappedStudents,
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

const getStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findById(
        req.params.id
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student: withProfileStrength(student),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    const existingStudent = await Student.findById(req.params.id);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let resumeUrl = `${getPublicBaseUrl(req)}/uploads/resumes/${req.file.filename}`;
    let resumePublicId;

    if (isCloudinaryConfigured()) {
      if (existingStudent.resumePublicId) {
        await cloudinary.uploader.destroy(existingStudent.resumePublicId, {
          resource_type: "raw",
        });
      }

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "campustrack/resumes",
        resource_type: "raw",
        use_filename: true,
      });
      resumeUrl = uploadResult.secure_url;
      resumePublicId = uploadResult.public_id;
      fs.unlink(req.file.path, () => {});
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        resumeUrl,
        resumePublicId,
        resumeFileName: req.file.originalname,
        resumeUploadedAt: new Date(),
        resumeStatus: "Pending",
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      resumeUrl,
      student: withProfileStrength(student),
    });
    await createAuditLog(req, "Resume Uploaded", "Student", student._id);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getResume = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || !student.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.json({
      success: true,
      resumeUrl: student.resumeUrl,
      resumeFileName: student.resumeFileName,
      resumeStatus: student.resumeStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const streamRemoteResume = (url, res, fileName, disposition) => {
  https
    .get(url, (remoteResponse) => {
      if (
        remoteResponse.statusCode >= 300 &&
        remoteResponse.statusCode < 400 &&
        remoteResponse.headers.location
      ) {
        streamRemoteResume(remoteResponse.headers.location, res, fileName, disposition);
        return;
      }

      if (remoteResponse.statusCode !== 200) {
        res.status(502).json({
          success: false,
          message: "Unable to fetch resume from storage",
        });
        return;
      }

      res.setHeader("Content-Type", remoteResponse.headers["content-type"] || getResumeContentType(fileName));
      res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
      remoteResponse.pipe(res);
    })
    .on("error", (error) => {
      res.status(502).json({
        success: false,
        message: error.message,
      });
    });
};

const getResumeFile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || !student.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const fileName = student.resumeFileName || `${student.usn || "student"}-resume`;
    const disposition = req.query.download === "true" ? "attachment" : "inline";
    const localPath = getLocalResumePath(student.resumeUrl);

    if (localPath && fs.existsSync(localPath)) {
      res.setHeader("Content-Type", getResumeContentType(fileName));
      res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
      return res.sendFile(localPath);
    }

    if (/^https:\/\//i.test(student.resumeUrl)) {
      streamRemoteResume(student.resumeUrl, res, fileName, disposition);
      return;
    }

    res.status(404).json({
      success: false,
      message: "Resume file is not available on this server",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyResume = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { resumeStatus: "Verified" },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student: withProfileStrength(student),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectResume = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { resumeStatus: "Rejected" },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student: withProfileStrength(student),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteResume = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.resumePublicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(student.resumePublicId, {
        resource_type: "raw",
      });
    }

    student.resumeUrl = undefined;
    student.resumePublicId = undefined;
    student.resumeFileName = undefined;
    student.resumeUploadedAt = undefined;
    student.resumeStatus = "Pending";
    await student.save();
    await createAuditLog(req, "Resume Deleted", "Student", student._id);

    res.json({
      success: true,
      student: withProfileStrength(student),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student,
    });
    await createAuditLog(req, "Student Updated", "Student", student._id);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteStudent = async (
  req,
  res
) => {
  try {
    const student = await Student.findByIdAndDelete(
      req.params.id
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student deleted",
    });
    await createAuditLog(req, "Student Deleted", "Student", student._id);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const importStudents = async (req, res) => {
  try {
    const rows = parseSpreadsheet(req.file);
    const errors = [];
    const requiredFields = [
      "usn",
      "name",
      "email",
      "department",
      "cgpa",
    ];
    const usns = rows
      .map((row) => String(row.usn || "").trim())
      .filter(Boolean);
    const existingStudents =
      await Student.find({
        usn: { $in: usns },
      }).select("usn");
    const existingUsns = new Set(
      existingStudents.map((student) =>
        student.usn.toLowerCase()
      )
    );
    const seenUsns = new Set();
    const validStudents = [];
    let duplicates = 0;
    let skipped = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const missing = requiredFields.filter(
        (field) =>
          row[field] === undefined ||
          row[field] === null ||
          row[field] === ""
      );

      if (missing.length) {
        skipped += 1;
        errors.push({
          row: rowNumber,
          message: `Missing required fields: ${missing.join(
            ", "
          )}`,
        });
        return;
      }

      const usn = String(row.usn).trim();
      const usnKey = usn.toLowerCase();
      const cgpa = Number(row.cgpa);

      if (!Number.isFinite(cgpa)) {
        skipped += 1;
        errors.push({
          row: rowNumber,
          message: "CGPA must be a number",
        });
        return;
      }

      if (
        existingUsns.has(usnKey) ||
        seenUsns.has(usnKey)
      ) {
        duplicates += 1;
        skipped += 1;
        return;
      }

      seenUsns.add(usnKey);
      validStudents.push({
        usn,
        name: String(row.name).trim(),
        email: String(row.email).trim(),
        phone: row.phone
          ? String(row.phone).trim()
          : undefined,
        department: String(
          row.department
        ).trim(),
        cgpa,
        graduationYear: row.graduationyear
          ? Number(row.graduationyear)
          : undefined,
        skills: row.skills
          ? String(row.skills)
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : [],
      });
    });

    let imported = 0;

    if (validStudents.length) {
      try {
        const result =
          await Student.insertMany(
            validStudents,
            {
              ordered: false,
            }
          );
        imported = result.length;
      } catch (error) {
        imported =
          error.insertedDocs?.length || 0;
        skipped +=
          validStudents.length - imported;

        if (error.writeErrors) {
          error.writeErrors.forEach(
            (writeError) => {
              errors.push({
                row:
                  (writeError.index || 0) + 2,
                message:
                  writeError.errmsg ||
                  writeError.message,
              });
            }
          );
        } else {
          errors.push({
            row: null,
            message: error.message,
          });
        }
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      duplicates,
      errors,
    });
    await createAuditLog(req, "Students Imported", "Student", null, {
      imported,
      skipped,
      duplicates,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  uploadResume,
  getResume,
  getResumeFile,
  verifyResume,
  rejectResume,
  deleteResume,
  getProfileStrength,
};
