const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // the party who paid us
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  // Set on the money received with a sale when it was made; it goes when that sale is deleted
  atSale: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  mode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'advance'],
    required: true
  },
  // The cash / bank account the money went into or came out of (older entries have none, see utils/accounts)
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  referenceNumber: { type: String }, // cheque no / UTR
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
