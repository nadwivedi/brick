const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String },
  address: { type: String },
  type: {
    type: String,
    enum: ['piece_rate', 'daily_wage', 'monthly'],
    required: true
  },
  rate: { type: Number, required: true }, // per 1000 bricks / per day / per month
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
