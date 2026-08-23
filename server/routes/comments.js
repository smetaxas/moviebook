const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const ReviewComment = require('../models/ReviewComment');
const WatchedMovie = require('../models/WatchedMovie');

// Get comments by watched movie ID
router.get('/:watchedMovieId', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const before = req.query.before ? new Date(req.query.before) : null;
    const beforeId = req.query.beforeId;

    const query = { watched_movie_id: req.params.watchedMovieId };
    if (before && !isNaN(before)) {
      // Tie-break on _id in case two comments share the same createdAt
      // millisecond — a plain createdAt cursor would silently drop one.
      query.$or = beforeId
        ? [{ createdAt: { $lt: before } }, { createdAt: before, _id: { $lt: beforeId } }]
        : [{ createdAt: { $lt: before } }];
    }

    const results = await ReviewComment.find(query)
      .populate('commenter_id', 'email username profile_photo')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .select('-__v');

    res.json({ comments: results.slice(0, limit), hasMore: results.length > limit });
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

// Delete a comment (author only)
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await ReviewComment.findOneAndDelete({
      _id: req.params.commentId,
      commenter_id: req.userId
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // If this was the last comment on your own unrated log, the log only
    // existed because of the comment(s) on it — clean it up too instead of
    // leaving an empty, ratingless log sitting in the community feed.
    let deletedLog = false;
    const watchedMovie = await WatchedMovie.findById(comment.watched_movie_id);
    if (watchedMovie && !watchedMovie.rating && String(watchedMovie.user_id) === req.userId) {
      const remaining = await ReviewComment.countDocuments({ watched_movie_id: comment.watched_movie_id });
      if (remaining === 0) {
        await WatchedMovie.findByIdAndDelete(watchedMovie._id);
        deletedLog = true;
      }
    }

    res.json({ message: 'Comment deleted successfully', deletedLog, watchedMovieId: comment.watched_movie_id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;