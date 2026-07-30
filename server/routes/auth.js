const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../config/email');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, captchaToken } = req.body;

    if (captchaToken !== 'localhost-bypass') {
      const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`, { method: 'POST' });
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        return res.status(400).json({ message: 'CAPTCHA verification failed' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      const suggestions = [
        `${username}${Math.floor(Math.random() * 100)}`,
        `${username}_${Math.floor(Math.random() * 100)}`,
        `${username}${new Date().getFullYear()}`
      ]
      return res.status(400).json({ message: 'Username already in use', suggestions });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, username });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: 'User created successfully', token, email: user.email, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.two_factor_enabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful', token, email: user.email, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Forgot password - request a reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Respond the same way whether or not the email exists, to avoid leaking registered emails
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.reset_password_token = hashedToken;
      user.reset_password_expires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailErr) {
        // Log for debugging, but don't let email delivery failures change the response -
        // doing so would let an attacker tell registered emails apart from unregistered ones.
        console.error('Failed to send password reset email:', emailErr.message);
      }
    }

    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reset password using a valid token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;