const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { ADMIN_COOKIE_NAME } = require('../middleware/adminAuth');
const { recordAdminActivity } = require('../utils/adminActivityLog');

// The admin panel and the API are on different addresses, so in production the cookie must allow cross-site use
const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  email: admin.email,
  lastLoginAt: admin.lastLoginAt || null,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

// @route POST /api/admin/auth/login
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin email or password' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions());

    recordAdminActivity(req, {
      action: 'login',
      entity: 'admin',
      entityId: admin._id,
      entityName: admin.email,
      summary: `${admin.email} signed in to the admin panel`,
      admin,
    });

    res.json({ success: true, message: 'Admin login successful', data: sanitizeAdmin(admin) });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/auth/current
exports.getCurrentAdmin = (req, res) => {
  res.json({ success: true, data: sanitizeAdmin(req.admin) });
};

// @route POST /api/admin/auth/logout
exports.logoutAdmin = (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Admin logout successful' });
};
