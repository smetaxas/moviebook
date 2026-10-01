const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profile_photo: {
    type: String,
    default: ''
  },
  two_factor_secret: {
    type: String,
    default: null
  },
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  // Private mode: other users see only the name and photo, not the lists
  // or community activity (see utils/privacy.js).
  is_private: {
    type: Boolean,
    default: false
  },
  password_changed_at: {
    type: Date,
    default: null
  },
  // Email change in progress: the new address waits here until its owner
  // opens the link we sent to it. Only a hash of the link's token is stored.
  pending_email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true
  },
  email_change_token: {
    type: String,
    default: null
  },
  email_change_expires: {
    type: Date,
    default: null
  },
  otp_code: {
    type: String,
    default: null
  },
  otp_expires: {
    type: Date,
    default: null
  },
  // Account lockout
  login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: {
    type: Date,
    default: null
  },

  refresh_token: {
  type: String,
  default: null
  },

  email_verified: {
  type: Boolean,
  default: false
  },

  email_verification_token: {
  type: String,
  default: null
  },
  
  email_verification_expires: {
  type: Date,
  default: null
  },

  reset_password_token: {
    type: String,
    default: null
  },

  reset_password_expires: {
    type: Date,
    default: null
  }
}, { timestamps: true, versionKey: false });

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return this.lock_until && this.lock_until > Date.now()
}

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lock_until && this.lock_until < Date.now()) {
    return await this.updateOne({
      $set: { login_attempts: 1 },
      $unset: { lock_until: 1 }
    })
  }

  const updates = { $inc: { login_attempts: 1 } }

  // Lock account after 5 failed attempts for 1 hour
  if (this.login_attempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lock_until: Date.now() + 60 * 60 * 1000 }
  }

  return await this.updateOne(updates)
}

module.exports = mongoose.model('User', userSchema);