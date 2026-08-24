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
  // Lazily backfilled from TMDB the first time genre stats are computed,
  // so existing logs don't need a migration and repeat stats requests
  // don't re-fetch genres for movies we've already resolved.
  movie_genres: {
    type: [String]
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