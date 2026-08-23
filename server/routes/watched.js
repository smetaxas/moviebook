const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const WatchedMovie = require('../models/WatchedMovie');
const ReviewComment = require('../models/ReviewComment');

// Log a movie
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movie_id, movie_title, movie_poster, movie_year, rating } = req.body;

    const existing = await WatchedMovie.findOne({
      user_id: req.userId,
      movie_id
    });

    if (existing) {
      if (existing.rating) {
        return res.status(400).json({ message: 'You have already logged this movie' });
      }
      // An unrated log already exists (created implicitly by commenting) —
      // add the rating to it instead of rejecting as a duplicate.
      existing.rating = rating;
      existing.movie_title = movie_title || existing.movie_title;
      existing.movie_poster = movie_poster || existing.movie_poster;
      existing.movie_year = movie_year || existing.movie_year;
      await existing.save();
      return res.json(existing);
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

// Comment on a movie — every comment belongs to a log, so this finds the
// caller's existing log for the movie or creates an unrated one on the fly,
// then attaches the comment to it. Used wherever someone comments on a movie
// they haven't necessarily rated/logged yet.
router.post('/comment/:movieId', requireAuth, async (req, res) => {
  try {
    const { comment, gif_url, movie_title, movie_poster, movie_year } = req.body;
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    if (!trimmedComment && !gif_url) {
      return res.status(400).json({ message: 'Comment text or a GIF is required' });
    }

    if (gif_url && !/^https:\/\/media\d*\.giphy\.com\//.test(gif_url)) {
      return res.status(400).json({ message: 'Invalid GIF URL' });
    }

    let watchedMovie = await WatchedMovie.findOne({ user_id: req.userId, movie_id: req.params.movieId });
    let createdLog = false;

    if (!watchedMovie) {
      if (!movie_title) {
        return res.status(400).json({ message: 'movie_title is required to log this movie' });
      }
      watchedMovie = await WatchedMovie.create({
        user_id: req.userId,
        movie_id: req.params.movieId,
        movie_title,
        movie_poster,
        movie_year
      });
      createdLog = true;
    }

    const newComment = await ReviewComment.create({
      watched_movie_id: watchedMovie._id,
      commenter_id: req.userId,
      comment: trimmedComment,
      gif_url: gif_url || null
    });
    const populatedComment = await newComment.populate('commenter_id', 'email username profile_photo');

    res.status(201).json({ comment: populatedComment, watchedMovieId: watchedMovie._id, createdLog });
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
      { returnDocument: 'after' }
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