const stats = {
  totalRequests: 0,
  errorCount: 0,
  lastRequestAt: null,
};

const requestStats = (req, res, next) => {
  stats.totalRequests += 1;
  stats.lastRequestAt = new Date().toISOString();

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      stats.errorCount += 1;
    }
  });

  next();
};

module.exports = {
  requestStats,
  stats,
};
