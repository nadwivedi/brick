const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redeemAccessToken, createAdminSessionToken } = require('../utils/adminAccess');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc  Login
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile and password' });
    }

    const user = await User.findOne({ mobile }).select('+password').populate('organization');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  An admin's one-time link from the admin panel: an app session for that user, not counted as their sign-in
// @route POST /api/auth/admin-access
exports.adminAccess = async (req, res) => {
  try {
    const { userId, adminId } = redeemAccessToken(req.body?.token);
    const user = await User.findById(userId).populate('organization');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      token: createAdminSessionToken(user._id, adminId),
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        organization: user.organization,
        adminAccess: true
      }
    });
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      message: expired ? 'This access link has expired. Open it again from the admin panel.' : error.message || 'Invalid access link'
    });
  }
};
