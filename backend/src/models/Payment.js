const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  mode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'advance'],
    required: true
  },
  referenceNumber: { type: String }, // cheque no / UTR
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
