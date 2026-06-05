const express = require("express");
const mongoose = require("mongoose");
const { stats } = require("../middleware/requestStats");

const router = express.Router();

const getDatabaseStatus = () => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
};

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    database: getDatabaseStatus(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.get("/system", (req, res) => {
  res.json({
    backendStatus: "online",
    databaseStatus: getDatabaseStatus(),
    apiLatency: null,
    totalRequests: stats.totalRequests,
    errorCount: stats.errorCount,
    serverUptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    lastRequestAt: stats.lastRequestAt,
  });
});

module.exports = router;
