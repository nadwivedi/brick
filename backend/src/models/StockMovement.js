const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }, // not set for manual adjustments
  itemType: { type: String, enum: ['product', 'material'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemType' },
  qtyIn: { type: Number, default: 0 },
  qtyOut: { type: Number, default: 0 },
  unit: { type: String }, // unit the quantities are in (the item's stock unit at the time)
  refType: {
    type: String,
    enum: ['production', 'purchase', 'sale', 'adjustment', 'opening'],
    required: true
  },
  refId: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
