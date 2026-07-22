const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const requireAuth = require('../middleware/auth');
const User = require('../models/User');

// Generate 2FA secret and QR code
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `MovieBook (${req.userId})`
    });

    await User.findByIdAndUpdate(req.userId, {
      two_factor_secret: secret.base32
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({ secret: secret.base32, qrCode: qrCodeUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify and enable 2FA
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.userId);

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    await User.findByIdAndUpdate(req.userId, { two_factor_enabled: true });

    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Disable 2FA
router.post('/disable', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      two_factor_enabled: false,
      two_factor_secret: null
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Validate 2FA token during login
router.post('/validate', async (req, res) => {
  try {
    const { userId, token } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    res.json({ message: 'Valid', userId: user._id, email: user.email, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;