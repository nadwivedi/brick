const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['owner', 'manager', 'accountant', 'supervisor', 'sales', 'viewer'],
    default: 'viewer'
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }],
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date, default: null },
  // Set from the admin panel for owner accounts
  state: { type: String, trim: true, default: '' },
  district: { type: String, trim: true, default: '' },
  planType: { type: String, enum: ['yearly', 'lifetime'] },
  planPrice: { type: Number, min: 0, default: 0 },
  planStartAt: { type: Date, default: null },
  // Empty for a lifetime plan, which never ends
  planEndAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  lastActivityAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
