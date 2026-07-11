const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const requireAuth = require('../middleware/auth');

// Search movies via TMDB
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=en-US`
    );

    const data = await response.json();

    const movies = data.results.map(movie => ({
      tmdb_id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      description: movie.overview,
      poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
    }));

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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