const mongoose = require('mongoose');

const DEFAULT_EXPENSE_CATEGORIES = ['Labour', 'Diesel', 'Maintenance', 'Miscellaneous'];

const expenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// One category name per organization, case-insensitive
expenseCategorySchema.index({ organization: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Create the default expense categories for an organization if it has none yet
expenseCategorySchema.statics.ensureDefaults = async function (organization) {
  const count = await this.countDocuments({ organization });
  if (count > 0) return;
  try {
    await this.insertMany(
      DEFAULT_EXPENSE_CATEGORIES.map(name => ({ name, organization, isDefault: true })),
      { ordered: false }
    );
  } catch (e) {
    // Another request may have seeded them at the same time — ignore duplicates
    if (e.code !== 11000) throw e;
  }
};

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
module.exports.DEFAULT_EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
