const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, default: 'kg' },
  lowStockThreshold: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Map of material id -> the unit its stock is counted in, for one organization's materials
materialSchema.statics.unitMap = async function (ids, organization) {
  const found = await this.find({ _id: { $in: ids.filter(Boolean) }, organization }).select('unit');
  return new Map(found.map(m => [String(m._id), m.unit]));
};

module.exports = mongoose.model('Material', materialSchema);
