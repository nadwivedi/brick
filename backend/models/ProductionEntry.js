const mongoose = require('mongoose');

const productionEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityProduced: { type: Number, required: true, min: 0 },
  quantityDamaged: { type: Number, default: 0 },
  // When entered by plates: quantityProduced = plates × bricksPerPlate (the rate used that day)
  plates: { type: Number, min: 0 },
  bricksPerPlate: { type: Number, min: 0 },
  shift: { type: String, enum: ['morning', 'evening', 'night', 'full_day'], default: 'full_day' },
  notes: { type: String },
  materials: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    quantity: { type: Number },
    unit: { type: String }
  }],
  labourEntries: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    quantity: { type: Number },
    earning: { type: Number }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);
