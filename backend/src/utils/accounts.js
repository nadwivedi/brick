const mongoose = require('mongoose');
const Account = require('../models/Account');
const AccountTransfer = require('../models/AccountTransfer');
const Payment = require('../models/Payment');
const VendorPayment = require('../models/VendorPayment');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
require('../models/Party'); // the book shows party names
require('../models/Invoice'); // and the invoice a receipt was for

const CASH_ACCOUNT_NAME = 'Cash Account';
// How money moves through a bank account; cash accounts are always 'cash'
const BANK_MODES = ['upi', 'bank_transfer', 'cheque'];

/**
 * The business's default account: entries without an account count under it and pickers start on it.
 * A new business gets "Cash Account".
 */
const ensureDefaultAccount = async (organization) => {
  const current = await Account.findOne({ organization, isDefault: true });
  if (current) return current;
  const oldest = await Account.findOne({ organization }).sort({ createdAt: 1 });
  if (oldest) {
    oldest.isDefault = true;
    return oldest.save();
  }
  try {
    return await Account.create({ organization, name: CASH_ACCOUNT_NAME, type: 'cash', isDefault: true });
  } catch (e) {
    // Another request created it at the same moment
    if (e.code !== 11000) throw e;
    return Account.findOne({ organization, isDefault: true });
  }
};

/** The business's account for an id sent by the client, or the default account when it is missing or not theirs. */
const pickAccount = async (organization, accountId) => {
  if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
    const account = await Account.findOne({ _id: accountId, organization });
    if (account) return account;
  }
  return ensureDefaultAccount(organization);
};

/** The payment mode saved with an entry: cash for a cash account, else the bank mode asked for (UPI / bank / cheque). */
const modeFor = (account, requested) => (account.type === 'cash' ? 'cash' : BANK_MODES.includes(requested) ? requested : 'bank_transfer');

/**
 * Every movement of money through the business's accounts, oldest first:
 * money received from parties (also what is received on a sale), money paid to parties,
 * the amount paid with a purchase, expenses, and transfers between accounts.
 * Entries saved before accounts existed have no account: cash ones count under the default
 * account, UPI / bank / cheque ones under the first bank account (or the default if there is none).
 */
const loadAccountBook = async (organization) => {
  const defaultAccount = await ensureDefaultAccount(organization);
  const [accounts, received, paid, purchases, expenses, transfers] = await Promise.all([
    Account.find({ organization }).lean(),
    Payment.find({ organization }).populate('customer', 'name').populate('invoice', 'invoiceNumber').lean(),
    VendorPayment.find({ organization }).populate('vendor', 'name').lean(),
    Purchase.find({ organization, paidAmount: { $gt: 0 } }).populate('vendor', 'name').lean(),
    Expense.find({ organization }).lean(),
    AccountTransfer.find({ organization }).lean(),
  ]);

  // Default account first, then cash before bank, then by name
  accounts.sort((a, b) => (Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)))
    || ((a.type === 'cash' ? 0 : 1) - (b.type === 'cash' ? 0 : 1))
    || a.name.localeCompare(b.name));

  const ids = new Set(accounts.map(a => String(a._id)));
  const nameOf = new Map(accounts.map(a => [String(a._id), a.name]));
  const defaultId = String(defaultAccount._id);
  const firstBank = accounts.filter(a => a.type === 'bank').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  const legacyBankId = firstBank ? String(firstBank._id) : defaultId;
  const resolve = (accountId, mode) => {
    const id = accountId ? String(accountId) : '';
    if (ids.has(id)) return id;
    return BANK_MODES.includes(mode) ? legacyBankId : defaultId;
  };

  const words = (s) => (s || '').replace(/_/g, ' ');
  const join = (parts) => parts.filter(Boolean).join(' · ');
  const movements = [];
  const add = (m) => { if (m.amount > 0) movements.push(m); };

  for (const p of received) {
    add({
      accountId: resolve(p.account, p.mode), type: 'received', direction: 'in', amount: p.amount || 0,
      date: p.date, createdAt: p.createdAt, refId: p._id,
      title: p.customer?.name || 'Money received',
      detail: join([p.invoice?.invoiceNumber ? `Sale ${p.invoice.invoiceNumber}` : '', p.mode !== 'cash' ? words(p.mode) : '', p.referenceNumber ? `Ref ${p.referenceNumber}` : '', p.notes]),
    });
  }
  for (const p of paid) {
    add({
      accountId: resolve(p.account, p.mode), type: 'paid', direction: 'out', amount: p.amount || 0,
      date: p.date, createdAt: p.createdAt, refId: p._id,
      title: p.vendor?.name || 'Money paid',
      detail: join([p.mode !== 'cash' ? words(p.mode) : '', p.referenceNumber ? `Ref ${p.referenceNumber}` : '', p.notes]),
    });
  }
  for (const p of purchases) {
    add({
      accountId: resolve(p.account, p.paymentMode), type: 'purchase', direction: 'out', amount: p.paidAmount || 0,
      date: p.date, createdAt: p.createdAt, refId: p._id,
      title: p.vendor?.name || 'Purchase',
      detail: join([p.billNumber ? `Paid with purchase · Bill ${p.billNumber}` : 'Paid with purchase', p.paymentMode !== 'cash' ? words(p.paymentMode) : '']),
    });
  }
  for (const e of expenses) {
    add({
      accountId: resolve(e.account, e.paymentMode), type: 'expense', direction: 'out', amount: e.amount || 0,
      date: e.date, createdAt: e.createdAt, refId: e._id,
      title: e.category || 'Expense',
      detail: e.description || '',
    });
  }
  for (const t of transfers) {
    const fromId = resolve(t.fromAccount);
    const toId = resolve(t.toAccount);
    const base = { type: 'transfer', amount: t.amount || 0, date: t.date, createdAt: t.createdAt, refId: t._id, detail: t.notes || '' };
    add({ ...base, accountId: fromId, direction: 'out', title: `Transfer to ${nameOf.get(toId)}` });
    add({ ...base, accountId: toId, direction: 'in', title: `Transfer from ${nameOf.get(fromId)}` });
  }

  movements.sort((a, b) => (new Date(a.date) - new Date(b.date)) || (new Date(a.createdAt) - new Date(b.createdAt)));
  return { accounts, movements };
};

module.exports = { CASH_ACCOUNT_NAME, BANK_MODES, ensureDefaultAccount, pickAccount, modeFor, loadAccountBook };
