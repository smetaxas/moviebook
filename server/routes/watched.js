const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const WatchedMovie = require('../models/WatchedMovie');

// Log a movie
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movie_id, movie_title, movie_poster, movie_year, rating, review } = req.body;

    // Check if user already logged this movie
    const existing = await WatchedMovie.findOne({
      user_id: req.userId,
      movie_id
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already logged this movie' });
    }

    const watchedMovie = await WatchedMovie.create({
      user_id: req.userId,
      movie_id,
      movie_title,
      movie_poster,
      movie_year,
      rating,
      review
    });

    res.status(201).json(watchedMovie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watched movies by user ID
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const watchedMovies = await WatchedMovie.find({ user_id: req.params.userId })
      .sort({ watchedAt: -1 })
      .select('-__v');

    res.json(watchedMovies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all watched movies (Community Feed)
router.get('/', requireAuth, async (req, res) => {
  try {
    const watchedMovies = await WatchedMovie.find()
      .populate('user_id', 'email')
      .sort({ watchedAt: -1 })
      .select('-__v');

    res.json(watchedMovies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watched movie by movie ID
router.get('/movie/:movieId', requireAuth, async (req, res) => {
  try {
    const watchedMovie = await WatchedMovie.findOne({
      user_id: req.userId,
      movie_id: req.params.movieId
    }).select('-__v');

    if (!watchedMovie) {
      return res.status(404).json({ message: 'Watched movie not found' });
    }

    res.json(watchedMovie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watched movie by _id
router.get('/id/:id', requireAuth, async (req, res) => {
  try {
    const watchedMovie = await WatchedMovie.findById(req.params.id).select('-__v');
    if (!watchedMovie) {
      return res.status(404).json({ message: 'Watched movie not found' });
    }
    res.json(watchedMovie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;