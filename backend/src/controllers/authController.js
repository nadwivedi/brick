const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Plant = require('../models/Plant');
const Unit = require('../models/Unit');
const Product = require('../models/Product');
const ExpenseCategory = require('../models/ExpenseCategory');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc  Register first user (owner) + create org
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, mobile, password, orgName, orgAddress, gstin } = req.body;

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    const org = await Organization.create({ name: orgName, mobile, address: orgAddress, gstin });
    const user = await User.create({
      name, mobile, password, role: 'owner', organization: org._id
    });
    org.owner = user._id;
    await org.save();
    // The business's first plant, named after it; more plants can be added later
    await Plant.create({ name: orgName, mobile, address: orgAddress, gstin, organization: org._id, isDefault: true });
    await Unit.ensureDefaults(org._id);
    await ExpenseCategory.ensureDefaults(org._id);
    await Product.insertMany(Product.DEFAULT_PRODUCTS.map(p => ({ ...p, organization: org._id })));

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role, organization: org }
    });
  } catch (error) {
    next(error);
  }
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
