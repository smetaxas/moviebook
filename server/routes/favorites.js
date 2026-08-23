const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Favorite = require('../models/Favorite');

// Get user's favorites
router.get('/', requireAuth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add movie to favorites
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movie_id, movie_title, movie_poster, movie_year } = req.body;

    const existing = await Favorite.findOne({ user_id: req.userId, movie_id });
    if (existing) {
      return res.status(400).json({ message: 'Movie already in favorites' });
    }

    const favorite = await Favorite.create({
      user_id: req.userId,
      movie_id,
      movie_title,
      movie_poster,
      movie_year
    });

    res.status(201).json(favorite);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove movie from favorites
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Movie not found in favorites' });
    }

    res.json({ message: 'Movie removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get another user's favorites (public, requires auth)
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check if movie is in favorites
router.get('/check/:movieId', requireAuth, async (req, res) => {
  try {
    const item = await Favorite.findOne({
      user_id: req.userId,
      movie_id: req.params.movieId
    });
    res.json({ isFavorite: !!item, id: item?._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
