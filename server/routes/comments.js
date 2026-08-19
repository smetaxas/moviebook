const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const ReviewComment = require('../models/ReviewComment');

// Get comments by watched movie ID
router.get('/:watchedMovieId', requireAuth, async (req, res) => {
  try {
    const comments = await ReviewComment.find({ watched_movie_id: req.params.watchedMovieId })
      .populate('commenter_id', 'email username profile_photo')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create comment by watched movie ID
router.post('/:watchedMovieId', requireAuth, async (req, res) => {
  try {
    const { comment, gif_url } = req.body;
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    if (!trimmedComment && !gif_url) {
      return res.status(400).json({ message: 'Comment text or a GIF is required' });
    }

    if (gif_url && !/^https:\/\/media\d*\.giphy\.com\//.test(gif_url)) {
      return res.status(400).json({ message: 'Invalid GIF URL' });
    }

    const newComment = await ReviewComment.create({
      watched_movie_id: req.params.watchedMovieId,
      commenter_id: req.userId,
      comment: trimmedComment,
      gif_url: gif_url || null
    });

    const populated = await newComment.populate('commenter_id', 'email username profile_photo');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;