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
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expires: {
    type: Date,
    default: null
  },
  watchlist: [{
    movie_id: {
      type: String,
      required: true
    },
    movie_title: {
      type: String,
      required: true
    },
    movie_poster: {
      type: String,
      default: ''
    },
    movie_year: {
      type: Number,
      default: null
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema);