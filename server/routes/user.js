const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

// Get profile data
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Upload profile photo
router.post('/profile/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'moviebook/profiles', 
          transformation: [{ width: 200, height: 200, crop: 'fill' }] 
        },
        (error, result) => {
          if (error) {
            console.log('Cloudinary error:', error);
            reject(error);
          } else {
            console.log('Cloudinary success:', result.secure_url);
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile_photo: result.secure_url },
      { new: true }
    ).select('-password -__v');

    res.json({ message: 'Photo uploaded successfully', profile_photo: result.secure_url, user });
  } catch (err) {
    console.log('Upload error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get own watchlist
router.get('/profile/watchlist', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('watchlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.watchlist || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add movie to watchlist
router.post('/profile/watchlist', requireAuth, async (req, res) => {
  try {
    const { movie_id, movie_title, movie_poster, movie_year } = req.body;

    if (!movie_id || !movie_title) {
      return res.status(400).json({ message: 'movie_id and movie_title are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadySaved = (user.watchlist || []).some(item => item.movie_id === movie_id);
    if (alreadySaved) {
      return res.status(400).json({ message: 'Movie is already in your watchlist' });
    }

    user.watchlist.unshift({ movie_id, movie_title, movie_poster, movie_year });
    await user.save();

    res.status(201).json(user.watchlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove movie from watchlist
router.delete('/profile/watchlist/:movieId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.watchlist = (user.watchlist || []).filter(item => item.movie_id !== req.params.movieId);
    await user.save();

    res.json(user.watchlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete account
router.delete('/profile', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get public profile by user ID
router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -__v -two_factor_secret -otp_code -otp_expires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watched movies by user ID (public)
router.get('/profile/:userId/watched', requireAuth, async (req, res) => {
  try {
    const WatchedMovie = require('../models/WatchedMovie');
    const watchedMovies = await WatchedMovie.find({ user_id: req.params.userId })
      .sort({ watchedAt: -1 })
      .select('-__v');
    res.json(watchedMovies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;