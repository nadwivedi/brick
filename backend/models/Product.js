const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['fly_ash', 'red_clay', 'solid_block', 'hollow_block', 'paver', 'aac', 'other'],
    default: 'fly_ash'
  },
  size: { type: String, trim: true }, // size label, e.g. "9 x 4 x 3 inch"
  unit: { type: String, default: 'pcs' },
  defaultRate: { type: Number, default: 0 },
  labourRatePerBrick: { type: Number, default: 0, min: 0 }, // labour commission paid per brick made, e.g. ₹0.5
  openingStock: { type: Number, default: 0, min: 0 }, // bricks in hand before entries started here
  hsnCode: { type: String },
  gstPercent: { type: Number, default: 0 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Brick types created for every new organization at signup
const DEFAULT_PRODUCTS = [
  { name: '9 Inch Brick', size: '9 x 4 x 3 inch', labourRatePerBrick: 0.6 },
  { name: '8 Inch Brick', size: '8 x 4 x 3 inch', labourRatePerBrick: 0.5 },
];

module.exports = mongoose.model('Product', productSchema);
module.exports.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
