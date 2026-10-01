// Private accounts: other users can find them and see their name and photo,
// but not their lists, logs or community activity. The owner always sees
// everything of their own.
const User = require('../models/User');

// Fields of another user that are safe to send to anyone. Never the email,
// tokens, secrets or security state.
const PUBLIC_USER_FIELDS = '_id username profile_photo createdAt is_private';

const isSelf = (targetId, viewerId) => String(targetId) === String(viewerId);

// true when `targetId` is someone else's private account.
async function isHiddenFrom(targetId, viewerId) {
  if (!targetId || isSelf(targetId, viewerId)) return false;
  const user = await User.findById(targetId).select('is_private').lean();
  return Boolean(user?.is_private);
}

// The 403 every list endpoint answers with for a private account.
const privateResponse = (res) => res.status(403).json({ message: 'This account is private', private: true });

// For populated documents: keep the viewer's own, drop other private users'.
const visibleTo = (viewerId, getUser) => (doc) => {
  const user = getUser(doc);
  return !user?.is_private || isSelf(user._id, viewerId);
};

module.exports = { PUBLIC_USER_FIELDS, isHiddenFrom, privateResponse, visibleTo };
