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

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const watchedMovies = await WatchedMovie.find({ user_id: req.userId }).select('-__v');

    // Backfill genres for any movies logged before we started storing them.
    // Mongoose auto-initializes untyped array fields to [] even when never
    // set, so an empty array (not just a missing one) means "not fetched yet".
    const missingGenres = watchedMovies.filter(m => !m.movie_genres || m.movie_genres.length === 0);
    await Promise.all(missingGenres.map(async (movie) => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.movie_id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`);
        const data = await res.json();
        movie.movie_genres = data.genres?.map(g => g.name) || [];
        await movie.save();
      } catch (err) {
        movie.movie_genres = [];
      }
    }));

    // Same lazy-backfill deal for director, sourced from the movie's credits.
    const missingDirectors = watchedMovies.filter(m => !m.movie_director);
    await Promise.all(missingDirectors.map(async (movie) => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.movie_id}/credits?api_key=${process.env.TMDB_API_KEY}`);
        const data = await res.json();
        const director = data.crew?.find(member => member.job === 'Director');
        if (director) {
          movie.movie_director = director.name;
          await movie.save();
        }
      } catch (err) {
        // Leave movie_director unset so this retries on the next stats request.
      }
    }));

    const totalMovies = watchedMovies.length;

    const totalMinutes = watchedMovies.reduce((acc, movie) => acc + (movie.movie_runtime || 100), 0);
    const totalHours = Math.round(totalMinutes / 60);

    const ratings = watchedMovies.filter(m => m.rating).map(m => m.rating);
    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = ratings.filter(r => r === star).length
      return acc
    }, {})

    const moviesPerYear = watchedMovies.reduce((acc, movie) => {
      const year = movie.movie_year || 'Unknown'
      acc[year] = (acc[year] || 0) + 1
      return acc
    }, {})

    const moviesPerDecade = watchedMovies.reduce((acc, movie) => {
      if (!movie.movie_year) return acc
      const decade = Math.floor(movie.movie_year / 10) * 10
      acc[`${decade}s`] = (acc[`${decade}s`] || 0) + 1
      return acc
    }, {})

    const moviesPerGenre = watchedMovies.reduce((acc, movie) => {
      (movie.movie_genres || []).forEach(genre => {
        acc[genre] = (acc[genre] || 0) + 1
      })
      return acc
    }, {})

    const directorCounts = watchedMovies.reduce((acc, movie) => {
      if (!movie.movie_director) return acc
      acc[movie.movie_director] = (acc[movie.movie_director] || 0) + 1
      return acc
    }, {})
    const topDirectors = Object.entries(directorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const currentYear = new Date().getFullYear()
    const moviesPerMonth = Array(12).fill(0)
    watchedMovies.forEach(movie => {
      const date = new Date(movie.watchedAt)
      if (date.getFullYear() === currentYear) {
        moviesPerMonth[date.getMonth()]++
      }
    })

    res.json({
      totalMovies,
      totalHours,
      avgRating,
      moviesPerYear,
      moviesPerDecade,
      moviesPerGenre,
      moviesPerMonth,
      ratingDistribution,
      topDirectors
    })
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