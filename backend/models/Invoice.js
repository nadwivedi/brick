const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true }, // INV-0001, INV-0002, ... per organization
  date: { type: Date, required: true, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // the party the bricks are sold to
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
  // Transport (see utils/transport). transportCharges above is what the party pays for it.
  transportMode: { type: String, enum: ['party', 'own', 'hired'], default: 'party' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' }, // who a hired vehicle is hired from
  transportBasis: { type: String, enum: ['per_trip', 'per_ton', 'per_km', 'per_1000', 'fixed'], default: 'per_trip' },
  transportQty: { type: Number, default: 0 },
  transportRate: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 }, // what we owe the transporter
  transportLocation: { type: String, trim: true }, // where a per-trip delivery went
  vehicleNumber: { type: String },
  driverName: { type: String },
  siteAddress: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

// Each business numbers its own invoices, so the number only has to be unique within it
invoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
