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
  // Optional: a log can exist without a rating when it's created implicitly
  // by commenting on an unwatched movie rather than through the rate/log flow.
  rating: {
    type: Number,
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