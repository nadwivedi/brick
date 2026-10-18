const mongoose = require('mongoose');

// Money paid to a vendor on account (not tied to one purchase)
const vendorPaymentSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  mode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
    required: true
  },
  referenceNumber: { type: String }, // cheque no / UTR
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema);
