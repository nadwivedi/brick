const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  gstTotal: { type: Number, default: 0 },
  transportCharges: { type: Number, default: 0 },
  loadingCharges: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'issued', 'partial', 'paid', 'cancelled'],
    default: 'issued'
  },
  vehicleNumber: { type: String },
  driverName: { type: String },
  siteAddress: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
