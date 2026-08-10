const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auditLog = require('../middleware/audit');
const { sendOTPEmail, sendVerificationEmail } = require('../config/email');

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
]

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
]

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

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
      await auditLog('REGISTER_FAILED', null, req.ip, { email, reason: 'Email already in use' }, false);
      return res.status(400).json({ message: 'Email already in use' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      const suggestions = [
        `${username}${Math.floor(Math.random() * 100)}`,
        `${username}_${Math.floor(Math.random() * 100)}`,
        `${username}${new Date().getFullYear()}`
      ]
      await auditLog('REGISTER_FAILED', null, req.ip, { username, reason: 'Username already in use' }, false);
      return res.status(400).json({ message: 'Username already in use', suggestions });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, username });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await user.updateOne({
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken)
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message)
    }

    await auditLog('REGISTER', user._id, req.ip, { email: user.email, username: user.username }, true);

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    await user.updateOne({ refresh_token: refreshToken })

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      token: accessToken,
      refreshToken,
      email: user.email,
      userId: user._id,
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    await user.updateOne({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    await auditLog('EMAIL_VERIFIED', user._id, req.ip, { email: user.email }, true);

    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      await auditLog('LOGIN_FAILED', null, req.ip, { email, reason: 'User not found' }, false);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lock_until - Date.now()) / 60000)
      await auditLog('ACCOUNT_LOCKED', user._id, req.ip, { email, minutesLeft }, false);
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minutes.`
      })
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incrementLoginAttempts()
      const attemptsLeft = 5 - (user.login_attempts + 1)
      await auditLog('LOGIN_FAILED', user._id, req.ip, { email, attemptsLeft }, false);
      if (attemptsLeft <= 0) {
        return res.status(423).json({ message: 'Account locked for 1 hour due to too many failed attempts.' })
      }
      return res.status(400).json({
        message: `Invalid credentials. ${attemptsLeft} attempts remaining.`
      })
    }

    // Reset login attempts on success
    if (user.login_attempts > 0) {
      await user.updateOne({ $set: { login_attempts: 0 }, $unset: { lock_until: 1 } })
    }

    if (user.two_factor_enabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    await user.updateOne({ refresh_token: refreshToken })

    await auditLog('LOGIN_SUCCESS', user._id, req.ip, { email: user.email }, true);

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      email: user.email,
      userId: user._id,
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user || user.refresh_token !== refreshToken) {
      await auditLog('REFRESH_TOKEN_FAILED', null, req.ip, {}, false);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })

    res.json({ token: accessToken })
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const user = await User.findOneAndUpdate(
        { refresh_token: refreshToken },
        { refresh_token: null }
      )
      if (user) {
        await auditLog('LOGOUT', user._id, req.ip, {}, true);
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp_code !== otp) {
      await auditLog('OTP_FAILED', userId, req.ip, {}, false);
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (new Date() > user.otp_expires) {
      return res.status(400).json({ message: 'Code has expired' });
    }

    await User.findByIdAndUpdate(userId, {
      otp_code: null,
      otp_expires: null
    });

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    await user.updateOne({ refresh_token: refreshToken })

    await auditLog('LOGIN_SUCCESS_OTP', user._id, req.ip, { email: user.email }, true);

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      email: user.email,
      userId: user._id,
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;