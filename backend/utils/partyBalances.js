const Party = require('../models/Party');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const VendorPayment = require('../models/VendorPayment');

// Sales carried by a hired vehicle with a cost owed to its transporter
const HIRED_TRANSPORT = { transportMode: 'hired', transportCost: { $gt: 0 }, status: { $nin: ['draft', 'cancelled'] } };

// Totals per party, keyed by id: sales and money received, purchases and money paid.
// A vehicle hired from a party for a sale counts as bought from them.
// `date` is an optional Mongo condition on the entry date (e.g. { $lt: start }).
const partyTotals = async (organization, date) => {
  const match = date ? { organization, date } : { organization };
  const byId = (rows) => Object.fromEntries(rows.map(r => [String(r._id), r]));
  const [sales, received, purchases, paidOnAccount, hired] = await Promise.all([
    Invoice.aggregate([
      { $match: { ...match, status: { $nin: ['draft', 'cancelled'] } } },
      { $group: { _id: '$customer', total: { $sum: '$totalAmount' }, count: { $sum: 1 }, lastDate: { $max: '$date' } } },
    ]),
    Payment.aggregate([
      { $match: match },
      { $group: { _id: '$customer', total: { $sum: '$amount' } } },
    ]),
    Purchase.aggregate([
      { $match: match },
      { $group: {
        _id: '$vendor',
        total: { $sum: { $add: ['$totalAmount', { $ifNull: ['$transportCharges', 0] }] } },
        paid: { $sum: { $ifNull: ['$paidAmount', 0] } },
        count: { $sum: 1 }, lastDate: { $max: '$date' },
      } },
    ]),
    VendorPayment.aggregate([
      { $match: match },
      { $group: { _id: '$vendor', total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate([
      { $match: { ...match, ...HIRED_TRANSPORT } },
      { $group: { _id: '$transporter', total: { $sum: '$transportCost' }, count: { $sum: 1 }, lastDate: { $max: '$date' } } },
    ]),
  ]);

  const salesById = byId(sales);
  const hiredById = byId(hired);
  const receivedById = byId(received);
  const purchasesById = byId(purchases);
  const paidById = byId(paidOnAccount);
  return (id) => {
    const sold = salesById[id];
    const bought = purchasesById[id];
    const hire = hiredById[id];
    return {
      sales: sold?.total || 0, salesCount: sold?.count || 0,
      received: receivedById[id]?.total || 0,
      purchases: (bought?.total || 0) + (hire?.total || 0), purchaseCount: (bought?.count || 0) + (hire?.count || 0),
      // Paid along with purchases + paid on account
      paid: (bought?.paid || 0) + (paidById[id]?.total || 0),
      lastDate: [sold?.lastDate, bought?.lastDate, hire?.lastDate].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null,
    };
  };
};

// What a set of totals moves the balance by (positive = they owe us more)
const balanceChange = (t) => t.sales - t.received - t.purchases + t.paid;

// Balance of every party, keyed by id, with its totals
// (opening + sales - received - purchases + paid; positive = they owe us, negative = we owe them).
// Sales and purchases only count what was paid with them; money moved later goes through
// Money Received / Money Paid against the party, so the party balance is the one true due.
const partyBalances = async (organization) => {
  const [parties, totalsOf] = await Promise.all([
    Party.find({ organization }).select('openingBalance').lean(),
    partyTotals(organization),
  ]);
  return Object.fromEntries(parties.map(p => {
    const row = totalsOf(String(p._id));
    row.balance = (p.openingBalance || 0) + balanceChange(row);
    return [String(p._id), row];
  }));
};

// The receivable / payable totals and the parties owing (or owed) the most, biggest first
const topDues = async (organization, limit = 7) => {
  const [balances, parties] = await Promise.all([
    partyBalances(organization),
    Party.find({ organization }).select('name mobile').lean(),
  ]);
  const rows = parties.map(p => ({ _id: p._id, name: p.name, mobile: p.mobile, balance: balances[String(p._id)]?.balance || 0 }));
  const owing = rows.filter(r => r.balance > 0).sort((a, b) => b.balance - a.balance);
  const owed = rows.filter(r => r.balance < 0).sort((a, b) => a.balance - b.balance).map(r => ({ ...r, balance: -r.balance }));
  const sum = (list) => list.reduce((s, r) => s + r.balance, 0);
  return {
    receivable: sum(owing), receivableCount: owing.length, topReceivable: owing.slice(0, limit),
    payable: sum(owed), payableCount: owed.length, topPayable: owed.slice(0, limit),
  };
};

module.exports = { HIRED_TRANSPORT, partyTotals, balanceChange, partyBalances, topDues };
