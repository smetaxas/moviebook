const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
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
    type: Number,
    default: null
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Watchlist', watchlistSchema);