const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const roundRoutes = require("./routes/roundRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "Campus Interview Tracking API",
  });
});

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

module.exports = app;
