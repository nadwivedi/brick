const mongoose = require('mongoose');

// A cash book or bank account the business keeps money in. The balance is not stored: it is the
// opening balance plus the money received into it, less the money paid out of it (see utils/accounts).
const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['cash', 'bank'], default: 'bank' },
  openingBalance: { type: Number, default: 0 },
  notes: { type: String, trim: true, default: '' },
  // Entries saved before accounts existed count under this one, and money pickers start on it
  isDefault: { type: Boolean, default: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

// One name per business, case-insensitive
accountSchema.index({ organization: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Account', accountSchema);
