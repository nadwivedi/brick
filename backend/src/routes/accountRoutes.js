const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Account = require('../models/Account');
const AccountTransfer = require('../models/AccountTransfer');
const { ensureDefaultAccount, loadAccountBook } = require('../utils/accounts');

router.use(protect);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dayOf = (d) => new Date(d).toISOString().slice(0, 10);
const NAME_TAKEN = 'An account with this name already exists';

// Name, type, opening balance and notes from the request; `problem` says what is wrong
const readAccount = (body) => {
  const name = String(body.name || '').trim();
  const openingBalance = body.openingBalance === '' || body.openingBalance == null ? 0 : Number(body.openingBalance);
  if (!name) return { problem: 'Enter the account name' };
  if (!Number.isFinite(openingBalance)) return { problem: 'Opening balance must be a number' };
  return { name, type: body.type === 'cash' ? 'cash' : 'bank', openingBalance, notes: String(body.notes || '').trim() };
};

// @route GET /api/accounts — the business's cash and bank accounts, default first
router.get('/', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    await ensureDefaultAccount(organization);
    const accounts = await Account.find({ organization }).sort({ isDefault: -1, type: 1, name: 1 }).lean();
    res.json({ success: true, data: accounts });
  } catch (e) { next(e); }
});

// @route GET /api/accounts/summary — every account with money in / out and its balance now
router.get('/summary', async (req, res, next) => {
  try {
    const { accounts, movements } = await loadAccountBook(req.user.organization._id);
    const totals = new Map(accounts.map(a => [String(a._id), { moneyIn: 0, moneyOut: 0, entryCount: 0 }]));
    for (const m of movements) {
      const t = totals.get(m.accountId);
      if (m.direction === 'in') t.moneyIn += m.amount; else t.moneyOut += m.amount;
      t.entryCount += 1;
    }
    const rows = accounts.map(a => {
      const t = totals.get(String(a._id));
      return {
        _id: a._id, name: a.name, type: a.type, notes: a.notes || '', isDefault: Boolean(a.isDefault),
        openingBalance: a.openingBalance || 0, ...t,
        balance: (a.openingBalance || 0) + t.moneyIn - t.moneyOut,
      };
    });
    const sumBalance = (type) => rows.filter(r => !type || r.type === type).reduce((s, r) => s + r.balance, 0);
    res.json({
      success: true,
      data: { accounts: rows, totalBalance: sumBalance(), cashBalance: sumBalance('cash'), bankBalance: sumBalance('bank') },
    });
  } catch (e) { next(e); }
});

// @route GET /api/accounts/:id/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD
// One account's entries in the period, oldest first, each with the balance after it.
router.get('/:id/ledger', async (req, res, next) => {
  try {
    const { accounts, movements } = await loadAccountBook(req.user.organization._id);
    const account = accounts.find(a => String(a._id) === req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const from = DATE_RE.test(req.query.from || '') ? req.query.from : null;
    const to = DATE_RE.test(req.query.to || '') ? req.query.to : null;
    let balance = account.openingBalance || 0;
    let opening = balance;
    let moneyIn = 0;
    let moneyOut = 0;
    const entries = [];
    for (const m of movements) {
      if (m.accountId !== String(account._id)) continue;
      const day = dayOf(m.date);
      if (to && day > to) break;
      balance += m.direction === 'in' ? m.amount : -m.amount;
      if (from && day < from) { opening = balance; continue; }
      if (m.direction === 'in') moneyIn += m.amount; else moneyOut += m.amount;
      entries.push({
        type: m.type, refId: m.refId, date: m.date, title: m.title, detail: m.detail,
        moneyIn: m.direction === 'in' ? m.amount : 0, moneyOut: m.direction === 'out' ? m.amount : 0, balance,
      });
    }

    res.json({
      success: true,
      data: {
        account: { _id: account._id, name: account.name, type: account.type, notes: account.notes || '', isDefault: Boolean(account.isDefault) },
        from, to, opening, moneyIn, moneyOut, closing: opening + moneyIn - moneyOut, entries,
      },
    });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { problem, ...fields } = readAccount(req.body);
    if (problem) return res.status(400).json({ success: false, message: problem });
    await ensureDefaultAccount(organization);
    const account = await Account.create({ ...fields, organization });
    res.status(201).json({ success: true, data: account });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: NAME_TAKEN });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { problem, ...fields } = readAccount(req.body);
    if (problem) return res.status(400).json({ success: false, message: problem });
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization._id }, fields, { new: true, runValidators: true });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: NAME_TAKEN });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const account = await Account.findOne({ _id: req.params.id, organization });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    const { accounts, movements } = await loadAccountBook(organization);
    if (movements.some(m => m.accountId === String(account._id))) {
      return res.status(400).json({ success: false, message: 'This account has entries, so it cannot be deleted' });
    }
    if (accounts.length <= 1) {
      return res.status(400).json({ success: false, message: 'This is your only account. Add another account before deleting it.' });
    }
    await account.deleteOne();
    // The default role passes to the oldest account left
    if (account.isDefault) await ensureDefaultAccount(organization);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// @route POST /api/accounts/:id/default — make this the account money pickers start on
router.post('/:id/default', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const account = await Account.findOne({ _id: req.params.id, organization });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    await Account.updateMany({ organization, _id: { $ne: account._id } }, { $set: { isDefault: false } });
    account.isDefault = true;
    await account.save();
    res.json({ success: true, data: account });
  } catch (e) { next(e); }
});

// @route POST /api/accounts/transfers — move money between two of the business's accounts
router.post('/transfers', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { fromAccount, toAccount, date, notes } = req.body;
    const amount = Number(req.body.amount);
    if (!(amount > 0)) return res.status(400).json({ success: false, message: 'Enter an amount above zero' });
    if (![fromAccount, toAccount].every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Choose both accounts' });
    }
    if (String(fromAccount) === String(toAccount)) return res.status(400).json({ success: false, message: 'Choose two different accounts' });
    const owned = await Account.countDocuments({ organization, _id: { $in: [fromAccount, toAccount] } });
    if (owned !== 2) return res.status(404).json({ success: false, message: 'Account not found' });

    const transfer = await AccountTransfer.create({
      date: DATE_RE.test(date || '') ? date : new Date().toISOString().slice(0, 10),
      fromAccount, toAccount, amount,
      notes: String(notes || '').trim() || undefined,
      createdBy: req.user._id,
      organization,
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (e) { next(e); }
});

router.delete('/transfers/:id', async (req, res, next) => {
  try {
    const transfer = await AccountTransfer.findOneAndDelete({ _id: req.params.id, organization: req.user.organization._id });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
