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
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=en-US&sort_by=release_date.desc`
    );
    const data = await response.json();
    const movies = data.results
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .map(movie => ({
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

// Get trending movies from TMDB
router.get('/trending', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    const movies = data.results
      .filter(movie => movie.release_date && movie.release_date <= today)
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .map(movie => ({
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

// Get upcoming movies from TMDB
router.get('/upcoming', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=en-US&region=US`
    );
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    const movies = data.results
      .filter(movie => movie.release_date && movie.release_date > today)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        release_date: movie.release_date,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
      }));
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all genres from TMDB
router.get('/genres', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    res.json(data.genres);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get movies by genre
router.get('/genre/:genreId', requireAuth, async (req, res) => {
  try {
    const { yearFrom, yearTo } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${req.params.genreId}&language=en-US&sort_by=popularity.desc`;

    if (yearFrom) baseUrl += `&primary_release_date.gte=${yearFrom}-01-01`;
    if (yearTo) baseUrl += `&primary_release_date.lte=${yearTo}-12-31`;
    else baseUrl += `&primary_release_date.lte=${today}`;

    const firstRes = await fetch(`${baseUrl}&page=1`).then(r => r.json());
    const totalPages = Math.min(firstRes.total_pages, 10);

    const pagePromises = Array.from({ length: totalPages }, (_, i) =>
      fetch(`${baseUrl}&page=${i + 1}`).then(r => r.json())
    );

    const pages = await Promise.all(pagePromises);
    const allResults = pages.flatMap(page => page.results || []);

    const movies = allResults
      .filter(movie => movie.release_date && movie.release_date <= today)
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .map(movie => ({
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

// Get movie details from TMDB + OMDb
router.get('/tmdb/:tmdbId', requireAuth, async (req, res) => {
  try {
    const [movieRes, creditsRes, videosRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/credits?api_key=${process.env.TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/videos?api_key=${process.env.TMDB_API_KEY}&language=en-US`)
    ]);
    const [data, credits, videos] = await Promise.all([movieRes.json(), creditsRes.json(), videosRes.json()]);

    const director = credits.crew?.find(member => member.job === 'Director')?.name || null;
    const trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || null;

    // Cast - top 10
    const cast = credits.cast?.slice(0, 10).map(member => ({
      name: member.name,
      character: member.character,
      profile_url: member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : null
    })) || []

    // OMDb data για ratings
    let omdbData = null
    if (data.imdb_id) {
      try {
        const omdbRes = await fetch(`https://www.omdbapi.com/?i=${data.imdb_id}&apikey=${process.env.OMDB_API_KEY}`)
        omdbData = await omdbRes.json()
      } catch (omdbErr) {
        console.error('OMDb error:', omdbErr.message)
      }
    }

    const ratings = {
      imdb: omdbData?.imdbRating !== 'N/A' ? omdbData?.imdbRating : null,
      rotten_tomatoes: omdbData?.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null,
      metacritic: omdbData?.Metascore !== 'N/A' ? omdbData?.Metascore : null
    }

    const movie = {
      tmdb_id: data.id,
      imdb_id: data.imdb_id,
      title: data.title,
      year: data.release_date ? new Date(data.release_date).getFullYear() : null,
      release_date: data.release_date,
      description: data.overview,
      director,
      genres: data.genres?.map(g => g.name) || [],
      poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
      backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
      runtime: data.runtime,
      trailer_key: trailer ? trailer.key : null,
      cast,
      ratings
    }
    res.json(movie)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watch providers from TMDB
router.get('/tmdb/:tmdbId/providers', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${req.params.tmdbId}/watch/providers?api_key=${process.env.TMDB_API_KEY}`
    );
    const data = await response.json();
    const providers = data.results?.GR || data.results?.US || null;
    res.json({ providers });
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