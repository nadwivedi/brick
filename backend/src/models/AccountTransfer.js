const mongoose = require('mongoose');

// Money moved between two of the business's own accounts, e.g. cash deposited in the bank
const accountTransferSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('AccountTransfer', accountTransferSchema);
