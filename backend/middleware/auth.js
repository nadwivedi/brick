const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Last activity is saved at most once every few minutes per user, not on every request
const ACTIVITY_WRITE_GAP_MS = 5 * 60 * 1000;
const lastActivityWrite = new Map();

const recordActivity = (userId) => {
  const key = String(userId);
  const now = Date.now();
  if (now - (lastActivityWrite.get(key) || 0) < ACTIVITY_WRITE_GAP_MS) return;
  lastActivityWrite.set(key, now);
  User.updateOne({ _id: key }, { $set: { lastActivityAt: new Date(now) } }).catch(() => {
    // A missed activity time is not worth failing the request for
    lastActivityWrite.delete(key);
  });
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password').populate('organization');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    // Opened from the admin panel: works on a deactivated account and is not the user's own activity
    req.adminAccess = Boolean(decoded.adminAccess);
    if (!req.adminAccess) {
      if (!req.user.isActive) {
        return res.status(401).json({ success: false, message: 'Account deactivated' });
      }
      recordActivity(req.user._id);
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
