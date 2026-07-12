const mongoose = require('mongoose');

const watchedMovieSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    type: Number
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('WatchedMovie', watchedMovieSchema);