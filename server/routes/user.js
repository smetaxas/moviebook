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
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'moviebook/profiles', transformation: [{ width: 200, height: 200, crop: 'fill' }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;