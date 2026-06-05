const Student = require("../models/Student");
const { parseSpreadsheet } = require("../utils/fileParser");

const createStudent = async (
  req,
  res
) => {
  try {
    const student =
      await Student.create(req.body);

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
    const { search } = req.query;

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
        ],
      };
    }

    const students =
      await Student.find(query);

    res.json({
      success: true,
      count: students.length,
      students,
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
      student,
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

    res.json({
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

const deleteStudent = async (
  req,
  res
) => {
  try {
    await Student.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Student deleted",
    });
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
};
