const AuditLog = require('../models/AuditLog');

const auditLog = async (action, userId, ip, details, success = true) => {
  try {
    await AuditLog.create({
      user_id: userId || null,
      action,
      ip,
      details,
      success
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = auditLog;