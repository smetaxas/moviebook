const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Watchlist = require('../models/Watchlist');

// Get user's watchlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user_id: req.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add movie to watchlist
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('Watchlist POST:', req.body)
    const { movie_id, movie_title, movie_poster, movie_year } = req.body;

    const existing = await Watchlist.findOne({ user_id: req.userId, movie_id });
    if (existing) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    const watchlist = await Watchlist.create({
      user_id: req.userId,
      movie_id,
      movie_title,
      movie_poster,
      movie_year
    });

    res.status(201).json(watchlist);
  } catch (err) {
    console.log('Watchlist error:', err.message)
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove movie from watchlist
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!watchlist) {
      return res.status(404).json({ message: 'Movie not found in watchlist' });
    }

    res.json({ message: 'Movie removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get another user's watchlist (public, requires auth)
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check if movie is in watchlist
router.get('/check/:movieId', requireAuth, async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      user_id: req.userId,
      movie_id: req.params.movieId
    });
    res.json({ inWatchlist: !!item, id: item?._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;