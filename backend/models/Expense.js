const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
    default: 'cash'
  },
  // The cash / bank account the money went into or came out of (older entries have none, see utils/accounts)
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  billPhoto: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
