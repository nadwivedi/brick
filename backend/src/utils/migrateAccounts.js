const Account = require('../models/Account');
const Payment = require('../models/Payment');
const VendorPayment = require('../models/VendorPayment');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const { BANK_MODES, ensureDefaultAccount } = require('./accounts');

// Money entries saved before cash / bank accounts existed only say how they were paid.
// Each one is put in an account once: cash ones in the default "Cash Account", UPI / bank /
// cheque ones in the business's first bank account ("Bank Account" is added if it has none).
const SOURCES = [
  { Model: Payment, modeField: 'mode' },
  { Model: VendorPayment, modeField: 'mode' },
  { Model: Purchase, modeField: 'paymentMode', match: { paidAmount: { $gt: 0 } } },
  { Model: Expense, modeField: 'paymentMode' },
];

async function migrateAccounts() {
  let moved = 0;
  for (const { Model, modeField, match = {} } of SOURCES) {
    const missing = { ...match, account: null };
    const organizations = await Model.distinct('organization', missing);
    for (const organization of organizations) {
      const cash = await ensureDefaultAccount(organization);
      const hasBankEntries = await Model.exists({ ...missing, organization, [modeField]: { $in: BANK_MODES } });
      if (hasBankEntries) {
        let bank = await Account.findOne({ organization, type: 'bank' }).sort({ createdAt: 1 });
        if (!bank) bank = await Account.create({ organization, name: 'Bank Account', type: 'bank' });
        moved += (await Model.updateMany({ ...missing, organization, [modeField]: { $in: BANK_MODES } }, { $set: { account: bank._id } })).modifiedCount;
      }
      moved += (await Model.updateMany({ ...missing, organization }, { $set: { account: cash._id } })).modifiedCount;
    }
  }
  if (moved) console.log(`🏦 Put ${moved} older money entr${moved === 1 ? 'y' : 'ies'} in cash / bank accounts`);
}

module.exports = migrateAccounts;
