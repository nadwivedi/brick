const mongoose = require('mongoose');

const DEFAULT_UNITS = [
  { name: 'Bag', code: 'BAG' },
  { name: 'Ton', code: 'TON' },
  { name: 'KG', code: 'KG' },
  { name: 'Pieces', code: 'PCS' },
];

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Unit name and code are unique per organization, case-insensitive ("kg" and "KG" are the same)
const caseInsensitive = { locale: 'en', strength: 2 };
unitSchema.index({ organization: 1, name: 1 }, { unique: true, collation: caseInsensitive });
unitSchema.index(
  { organization: 1, code: 1 },
  { unique: true, collation: caseInsensitive, partialFilterExpression: { code: { $type: 'string' } } }
);

// Create the default units for an organization if it has none yet
unitSchema.statics.ensureDefaults = async function (organization) {
  const count = await this.countDocuments({ organization });
  if (count > 0) {
    // Units created before codes existed: fill in the default codes
    const missing = await this.find({ organization, isDefault: true, code: { $exists: false } });
    for (const unit of missing) {
      const def = DEFAULT_UNITS.find(d => d.name.toLowerCase() === unit.name.toLowerCase());
      if (def) await this.updateOne({ _id: unit._id }, { code: def.code }).catch(() => {});
    }
    return;
  }
  try {
    await this.insertMany(
      DEFAULT_UNITS.map(u => ({ ...u, organization, isDefault: true })),
      { ordered: false }
    );
  } catch (e) {
    // Another request may have seeded them at the same time — ignore duplicates
    if (e.code !== 11000) throw e;
  }
};

module.exports = mongoose.model('Unit', unitSchema);
module.exports.DEFAULT_UNITS = DEFAULT_UNITS;
