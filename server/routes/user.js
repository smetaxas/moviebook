const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
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

module.exports = router;