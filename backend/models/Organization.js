const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  address: { type: String },
  gstin: { type: String },
  logo: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    // Production entered as plates × bricks per plate instead of a brick count
    platesEnabled: { type: Boolean, default: false },
    bricksPerPlate: { type: Number, default: 0, min: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
