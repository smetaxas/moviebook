require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const movieRoutes = require('./routes/movies');
const watchedRoutes = require('./routes/watched');
const commentRoutes = require('./routes/comments');
const twoFactorRoutes = require('./routes/twoFactor')
const requireAuth = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cors());
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
app.use('/api/2fa', twoFactorRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Hello from MovieBook server!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});