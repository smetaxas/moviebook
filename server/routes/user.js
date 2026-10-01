const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const rateLimit = require('express-rate-limit');
const auditLog = require('../middleware/audit');
const { body, validationResult } = require('express-validator');
const { sendPasswordChangedEmail, sendEmailChangeConfirmation, sendEmailChangeNotice } = require('../config/email');
const { clientLink } = require('../config/clientUrl');
const { PUBLIC_USER_FIELDS, isHiddenFrom, privateResponse } = require('../utils/privacy');

// What the owner gets back about their own account: everything except the
// password and the security internals (secrets, tokens, lockout state).
const OWN_ACCOUNT_EXCLUDE = '-password -two_factor_secret -otp_code -otp_expires -refresh_token ' +
  '-email_verification_token -email_verification_expires -reset_password_token -reset_password_expires ' +
  '-login_attempts -lock_until -email_change_token';

const EMAIL_CHANGE_TTL = 60 * 60 * 1000; // the confirmation link lasts 1 hour
const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

// Resending the confirmation link: its own small allowance, so typos while
// requesting the change don't use it up.
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `resend:${req.userId}`,
  validate: { keyGeneratorIpFallback: false },
  message: { message: 'You can resend the link 3 times every 15 minutes. Please wait a little.' }
});

// Confirming an email change needs no sign-in (the link may be opened on
// another device), so it's limited per IP instead.
const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Please wait and try again.' }
});

// Starts (or restarts) the confirmation for user.pending_email: a fresh
// one-hour link to the new address. Only the token's hash is stored.
async function sendEmailChangeLink(user) {
  const token = crypto.randomBytes(32).toString('hex');
  user.email_change_token = hashToken(token);
  user.email_change_expires = new Date(Date.now() + EMAIL_CHANGE_TTL);
  await user.save();
  await sendEmailChangeConfirmation(user.pending_email, clientLink(`/confirm-email?token=${token}`));
}

// Password changes and account deletion: a handful of tries per account per
// 15 minutes, so the current password can't be brute-forced from a stolen
// session.
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `account:${req.userId}`,
  validate: { keyGeneratorIpFallback: false },
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' }
});

const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };

// Re-checks who's asking before a sensitive change: the current password,
// and the authenticator code when 2FA is on. Returns an error message, or
// null when both check out.
async function confirmIdentity(user, password, twoFactorCode) {
  if (!password || !(await bcrypt.compare(password, user.password))) {
    return 'Your current password is incorrect';
  }
  if (user.two_factor_enabled) {
    const ok = twoFactorCode && speakeasy.totp.verify({
      secret: user.two_factor_secret, encoding: 'base32', token: String(twoFactorCode).trim(), window: 1
    });
    if (!ok) return 'The authentication code is incorrect';
  }
  return null;
}

const passwordProblem = (pw) => {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters';
  if (pw.length > 128) return 'Password is too long';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  return null;
};

// Get profile data
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(OWN_ACCOUNT_EXCLUDE);
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
      { returnDocument: 'after' }
    ).select(OWN_ACCOUNT_EXCLUDE);

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

// Delete account — only after re-entering the password (and the 2FA code
// when it's on). Removes the account and everything that belongs to it.
router.delete('/profile', requireAuth, sensitiveLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, twoFactorCode } = req.body || {};
    const problem = await confirmIdentity(user, password, twoFactorCode);
    if (problem) {
      await auditLog('ACCOUNT_DELETE_FAILED', user._id, req.ip, { reason: problem }, false);
      return res.status(400).json({ message: problem });
    }

    const WatchedMovie = require('../models/WatchedMovie');
    const ReviewComment = require('../models/ReviewComment');
    const Watchlist = require('../models/Watchlist');
    const Favorite = require('../models/Favorite');

    const logIds = (await WatchedMovie.find({ user_id: user._id }).select('_id').lean()).map(w => w._id);
    await Promise.all([
      ReviewComment.deleteMany({ $or: [{ commenter_id: user._id }, { watched_movie_id: { $in: logIds } }] }),
      WatchedMovie.deleteMany({ user_id: user._id }),
      Watchlist.deleteMany({ user_id: user._id }),
      Favorite.deleteMany({ user_id: user._id })
    ]);
    await User.deleteOne({ _id: user._id });

    await auditLog('ACCOUNT_DELETED', user._id, req.ip, {}, true);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Private mode on/off.
router.patch('/account/privacy', requireAuth, async (req, res) => {
  try {
    if (typeof req.body?.is_private !== 'boolean') {
      return res.status(400).json({ message: 'is_private must be true or false' });
    }
    const user = await User.findByIdAndUpdate(req.userId, { is_private: req.body.is_private }, { returnDocument: 'after' })
      .select(OWN_ACCOUNT_EXCLUDE);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await auditLog('PRIVACY_CHANGED', user._id, req.ip, { is_private: user.is_private }, true);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change password: the current password (+ 2FA code) proves it's the owner,
// the new one must meet the same rules as sign-up and differ from the old.
// Afterwards every other session is signed out (their refresh token no
// longer matches), this one gets fresh tokens, and the owner is emailed.
router.post('/account/password', requireAuth, sensitiveLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { currentPassword, newPassword, twoFactorCode } = req.body || {};
    const problem = await confirmIdentity(user, currentPassword, twoFactorCode);
    if (problem) {
      await auditLog('PASSWORD_CHANGE_FAILED', user._id, req.ip, { reason: problem }, false);
      return res.status(400).json({ message: problem, field: problem.includes('code') ? 'twoFactorCode' : 'currentPassword' });
    }

    const weak = passwordProblem(newPassword);
    if (weak) return res.status(400).json({ message: weak, field: 'newPassword' });
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'Your new password must be different from the current one', field: 'newPassword' });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id, n: crypto.randomBytes(8).toString('hex') }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await user.updateOne({
      password: await bcrypt.hash(newPassword, 10),
      password_changed_at: new Date(),
      refresh_token: refreshToken,
      reset_password_token: null,
      reset_password_expires: null,
      login_attempts: 0,
      lock_until: null
    });

    await auditLog('PASSWORD_CHANGED', user._id, req.ip, {}, true);
    try {
      await sendPasswordChangedEmail(user.email, clientLink('/forgot-password'));
    } catch (emailErr) {
      console.error('Failed to send password-changed email:', emailErr.message);
    }

    res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: 'Password changed', token: accessToken, refreshToken, password_changed_at: new Date() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change email, step 1: the current password (+ 2FA code) proves it's the
// owner; the new address must be free. Nothing changes yet — a link goes to
// the new address, and the current one is told about the request.
// normalizeEmail matches what sign-up and login do, so the new address
// signs in exactly like one entered at registration.
router.post('/account/email', requireAuth, sensitiveLimiter,
  body('newEmail').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, field: 'newEmail' });

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { newEmail, password, twoFactorCode } = req.body;
      const problem = await confirmIdentity(user, password, twoFactorCode);
      if (problem) {
        await auditLog('EMAIL_CHANGE_FAILED', user._id, req.ip, { reason: problem }, false);
        return res.status(400).json({ message: problem, field: problem.includes('code') ? 'twoFactorCode' : 'password' });
      }
      if (newEmail === user.email) {
        return res.status(400).json({ message: 'That is already your email address', field: 'newEmail' });
      }
      if (await User.exists({ email: newEmail })) {
        return res.status(400).json({ message: 'That email is already used by another account', field: 'newEmail' });
      }

      user.pending_email = newEmail;
      try {
        await sendEmailChangeLink(user);
      } catch (emailErr) {
        user.pending_email = null;
        user.email_change_token = null;
        user.email_change_expires = null;
        await user.save();
        console.error('Failed to send email-change confirmation:', emailErr.message);
        return res.status(502).json({ message: "We couldn't send an email to that address. Please check it and try again." });
      }
      try {
        await sendEmailChangeNotice(user.email, newEmail, 'requested', clientLink('/forgot-password'));
      } catch (emailErr) {
        console.error('Failed to send email-change notice:', emailErr.message);
      }

      await auditLog('EMAIL_CHANGE_REQUESTED', user._id, req.ip, { to: newEmail }, true);
      res.json({ pending_email: user.pending_email, email_change_expires: user.email_change_expires });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// Send the confirmation link again (a new one; the old link stops working).
router.post('/account/email/resend', requireAuth, resendLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.pending_email) return res.status(400).json({ message: 'There is no email change waiting for confirmation' });
    await sendEmailChangeLink(user);
    res.json({ pending_email: user.pending_email, email_change_expires: user.email_change_expires });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel a pending change — its link stops working.
router.delete('/account/email/pending', requireAuth, async (req, res) => {
  try {
    await User.updateOne({ _id: req.userId }, { pending_email: null, email_change_token: null, email_change_expires: null });
    await auditLog('EMAIL_CHANGE_CANCELLED', req.userId, req.ip, {}, true);
    res.json({ pending_email: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change email, step 2: the link from the new inbox. Switches the address
// (now verified, since this proves it's theirs) and tells the old one.
router.post('/account/email/confirm', confirmLimiter, async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message: 'This confirmation link is invalid' });

    const user = await User.findOne({ email_change_token: hashToken(token) });
    if (!user || !user.pending_email) return res.status(400).json({ message: 'This confirmation link is invalid or has already been used' });
    if (!user.email_change_expires || user.email_change_expires < new Date()) {
      return res.status(400).json({ message: 'This confirmation link has expired. Request the change again from My account.', expired: true });
    }
    // taken by someone else in the meantime?
    if (await User.exists({ email: user.pending_email, _id: { $ne: user._id } })) {
      await user.updateOne({ pending_email: null, email_change_token: null, email_change_expires: null });
      return res.status(409).json({ message: 'That email is now used by another account. Please choose a different one.' });
    }

    const oldEmail = user.email;
    const newEmail = user.pending_email;
    await user.updateOne({
      email: newEmail,
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
      pending_email: null,
      email_change_token: null,
      email_change_expires: null
    });

    await auditLog('EMAIL_CHANGED', user._id, req.ip, { from: oldEmail, to: newEmail }, true);
    try {
      await sendEmailChangeNotice(oldEmail, newEmail, 'changed', clientLink('/forgot-password'));
    } catch (emailErr) {
      console.error('Failed to send email-changed notice:', emailErr.message);
    }
    res.json({ message: 'Email changed', email: newEmail });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Search other users by username. Returns public fields only (never email
// or anything account-related), the searcher themselves excluded.
// Usernames that START with the query rank first, then the rest A-Z.
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 50);
    if (!q) return res.json([]);

    // The query becomes a regex — escape it so ".*" or "(" are just text.
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await User.find({
      _id: { $ne: req.userId },
      username: { $regex: pattern, $options: 'i' }
    })
      .select('username profile_photo createdAt is_private')
      .limit(50)
      .lean();

    const lower = q.toLowerCase();
    const users = matches
      .sort((a, b) =>
        Number(b.username.toLowerCase().startsWith(lower)) - Number(a.username.toLowerCase().startsWith(lower)) ||
        a.username.localeCompare(b.username))
      .slice(0, 20);

    // How many movies each has logged, for the result cards.
    const WatchedMovie = require('../models/WatchedMovie');
    const counts = await WatchedMovie.aggregate([
      { $match: { user_id: { $in: users.map(u => u._id) } } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } }
    ]);
    const countById = new Map(counts.map(c => [String(c._id), c.count]));

    res.json(users.map(u => ({
      _id: u._id,
      username: u.username,
      profile_photo: u.profile_photo,
      createdAt: u.createdAt,
      is_private: Boolean(u.is_private),
      // a private account's activity isn't shared, so not its count either
      watchedCount: u.is_private ? null : (countById.get(String(u._id)) || 0)
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get public profile by user ID
router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(PUBLIC_USER_FIELDS).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const restricted = Boolean(user.is_private) && String(user._id) !== String(req.userId);
    res.json({ ...user, is_private: Boolean(user.is_private), restricted });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watched movies by user ID (public)
router.get('/profile/:userId/watched', requireAuth, async (req, res) => {
  try {
    if (await isHiddenFrom(req.params.userId, req.userId)) return privateResponse(res);
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