const mongoose = require('mongoose');

// The admin panel's login (adm.brickmanager.in). Created once with: npm run create-admin
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true, select: false },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
