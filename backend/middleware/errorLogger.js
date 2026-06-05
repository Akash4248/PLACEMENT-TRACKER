const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");
const errorLogPath = path.join(logsDir, "error.log");

const ensureLogsDir = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

const errorLogger = (err, req, res, next) => {
  ensureLogsDir();

  const entry = [
    `Timestamp: ${new Date().toISOString()}`,
    `Environment: ${process.env.NODE_ENV || "development"}`,
    `Route: ${req.method} ${req.originalUrl}`,
    `Message: ${err.message}`,
    `Stack: ${err.stack}`,
    "----------------------------------------",
  ].join("\n");

  fs.appendFile(errorLogPath, `${entry}\n`, () => {});

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

module.exports = errorLogger;
