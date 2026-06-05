const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const roundRoutes = require("./routes/roundRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const auditRoutes = require("./routes/auditRoutes");
const systemRoutes = require("./routes/systemRoutes");
const errorLogger = require("./middleware/errorLogger");
const { requestStats } = require("./middleware/requestStats");


const app = express();
const logsDir = path.join(__dirname, "logs");
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(requestStats);
app.use(
  morgan(":method :url :status :response-time ms", {
    stream: fs.createWriteStream(path.join(logsDir, "access.log"), {
      flags: "a",
    }),
  })
);
app.use(morgan(":method :url :status :response-time ms"));

app.get("/", (req, res) => {
  res.json({
    message:
      "Campus Interview Tracking API",
  });
});

app.use("/", systemRoutes);
app.use("/api", systemRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);
app.use(
  "/api/companies",
  companyRoutes
);
app.use("/api/rounds", roundRoutes);
app.use("/api/applications", applicationRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use(errorLogger);

module.exports = app;
