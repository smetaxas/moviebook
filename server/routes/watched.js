const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const WatchedMovie = require('../models/WatchedMovie');

// Log a movie
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movie_id, movie_title, movie_poster, movie_year, rating } = req.body;

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
      rating
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
      .sort({ movie_year: -1 })
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
      .populate('user_id', 'email username profile_photo')
      .sort({ movie_year: -1 })
      .select('-__v');
    res.json(watchedMovies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all watched movies by movie_id (all users) with comments
router.get('/all/movie/:movieId', requireAuth, async (req, res) => {
  try {
    const ReviewComment = require('../models/ReviewComment');

    const watchedMovies = await WatchedMovie.find({ movie_id: req.params.movieId })
      .populate('user_id', 'email username profile_photo')
      .sort({ movie_year: -1 })
      .select('-__v');

    const watchedWithComments = await Promise.all(
      watchedMovies.map(async (watched) => {
        const comments = await ReviewComment.find({ watched_movie_id: watched._id })
          .populate('commenter_id', 'email username profile_photo')
          .sort({ createdAt: -1 })
          .select('-__v');
        return { ...watched.toObject(), comments }
      })
    );

    res.json(watchedWithComments);
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

// Get watched movie by movie ID (tmdb id)
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

// Update rating
router.patch('/:id/rating', requireAuth, async (req, res) => {
  try {
    const { rating } = req.body;

    const watchedMovie = await WatchedMovie.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { rating },
      { new: true }
    ).select('-__v');

    if (!watchedMovie) {
      return res.status(404).json({ message: 'Watched movie not found' });
    }

    res.json(watchedMovie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete watched movie
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const watchedMovie = await WatchedMovie.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!watchedMovie) {
      return res.status(404).json({ message: 'Watched movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;