const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    default: null
  },
  details: {
    type: Object,
    default: {}
  },
  success: {
    type: Boolean,
    default: true
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);