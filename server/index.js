require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const movieRoutes = require('./routes/movies');
const watchedRoutes = require('./routes/watched');
const commentRoutes = require('./routes/comments');
const watchlistRoutes = require('./routes/watchlist');
const twoFactorRoutes = require('./routes/twoFactor');
const requireAuth = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// Security headers
app.use(helmet())

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://moviebook-opal.vercel.app'
  ],
  credentials: true
}))

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' }
})

app.use(generalLimiter)
app.use('/api/auth', authLimiter)

// Body parsing
app.use((req, res, next) => {
  if (req.originalUrl === '/api/user/profile/photo') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/movies', requireAuth, movieRoutes);
app.use('/api/watched', requireAuth, watchedRoutes);
app.use('/api/comments', requireAuth, commentRoutes);
app.use('/api/watchlist', requireAuth, watchlistRoutes);
app.use('/api/2fa', twoFactorRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Hello from CineLog server!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});