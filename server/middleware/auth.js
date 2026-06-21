const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = requireAuth;