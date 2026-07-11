const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const requireAuth = require('../middleware/auth');

// Get all movies
router.get('/', requireAuth, async (req, res) => {
  try {
    const movies = await Movie.find().select('-__v');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single movie
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-__v');
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;