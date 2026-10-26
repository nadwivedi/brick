const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String },
  gstin: { type: String },
  mobile: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isActive: { type: Boolean, default: true },
  // The main plant: new entries go to it unless another plant is picked. One per organization.
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Every organization has a default plant. One with no plant gets one named after the business;
// one with plants but no default has its oldest plant made the default.
plantSchema.statics.ensureDefault = async function (organization, businessName) {
  if (await this.exists({ organization: organization._id || organization, isDefault: true })) return;
  const orgId = organization._id || organization;
  const oldest = await this.findOne({ organization: orgId }).sort({ createdAt: 1 });
  if (oldest) {
    oldest.isDefault = true;
    await oldest.save();
  } else {
    await this.create({ name: businessName || 'Main Plant', organization: orgId, isDefault: true });
  }
};

module.exports = mongoose.model('Plant', plantSchema);
