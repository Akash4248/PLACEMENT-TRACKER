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
const systemRoutes = require("./routes/systemRoutes");
const errorLogger = require("./middleware/errorLogger");
const { requestStats } = require("./middleware/requestStats");


const app = express();
const logsDir = path.join(__dirname, "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
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

app.use(errorLogger);

module.exports = app;
