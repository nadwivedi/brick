const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // the party we bought from
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  items: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  transportCharges: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'credit'],
    default: 'credit'
  },
  billNumber: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
