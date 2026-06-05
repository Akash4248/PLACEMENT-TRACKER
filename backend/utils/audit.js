const AuditLog = require("../models/AuditLog");

const createAuditLog = async (req, action, entity, entityId, metadata = {}) => {
  try {
    await AuditLog.create({
      user: req.user?.id,
      action,
      entity,
      entityId,
      metadata,
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};

module.exports = createAuditLog;
