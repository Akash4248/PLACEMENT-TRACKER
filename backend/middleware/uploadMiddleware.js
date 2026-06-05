const multer = require("multer");

const allowedMimeTypes = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const validExtension = /\.(csv|xlsx|xls)$/i.test(
      file.originalname
    );

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      validExtension
    ) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Only CSV, XLS, and XLSX files are supported"
      )
    );
  },
});

module.exports = upload;
