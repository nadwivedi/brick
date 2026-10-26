const mongoose = require('mongoose');

// Anyone the business buys from or sells to. The same party can appear on sales and purchases.
const partySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  address: { type: String },
  gstin: { type: String },
  // Balance before entries started here: positive = they owe us (receivable), negative = we owe them (payable)
  openingBalance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
