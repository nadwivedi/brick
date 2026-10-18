const ProductionEntry = require('../models/ProductionEntry');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Material = require('../models/Material');
const Purchase = require('../models/Purchase');
const VendorPayment = require('../models/VendorPayment');

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Dates are stored as the calendar day at 00:00 UTC (from "YYYY-MM-DD" inputs),
// so the range is taken as whole UTC days to match.
const parseRange = (from, to) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const fromStr = DATE_RE.test(from || '') ? from : todayStr;
  const toStr = DATE_RE.test(to || '') ? to : fromStr;
  let start = new Date(`${fromStr}T00:00:00.000Z`);
  let end = new Date(`${toStr}T23:59:59.999Z`);
  if (start > end) [start, end] = [new Date(`${toStr}T00:00:00.000Z`), new Date(`${fromStr}T23:59:59.999Z`)];
  return { start, end };
};

const sumInRange = async (Model, match, field) => {
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } }
  ]);
  return result[0]?.total || 0;
};

// Totals per day (or per month for long ranges), with empty periods filled with 0
const trendInRange = async (Model, match, field, byMonth, start, end) => {
  const format = byMonth ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format, date: '$date' } }, total: { $sum: `$${field}` } } }
  ]);
  const totals = Object.fromEntries(rows.map(r => [r._id, r.total]));

  const keys = [];
  if (byMonth) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (d <= end) {
      keys.push(d.toISOString().slice(0, 7));
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
  } else {
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      keys.push(new Date(t).toISOString().slice(0, 10));
    }
  }
  return keys.map(k => ({ _id: k, total: totals[k] || 0 }));
};

// @route GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=
exports.getSummary = async (req, res, next) => {
  try {
    const { plant, from, to } = req.query;
    const orgId = req.user.organization._id;
    const { start, end } = parseRange(from, to);

    const baseQuery = { organization: orgId };
    if (plant) baseQuery.plant = plant;
    const inRange = { ...baseQuery, date: { $gte: start, $lte: end } };

    // Group charts by month when the range is longer than ~2 months
    const days = Math.round((end - start) / DAY_MS);
    const byMonth = days > 62;

    const [
      production, sales, collection, expenses, purchases, outstanding,
      productionTrend, salesTrend, collectionTrend
    ] = await Promise.all([
      sumInRange(ProductionEntry, inRange, 'quantityProduced'),
      sumInRange(Invoice, inRange, 'totalAmount'),
      sumInRange(Payment, inRange, 'amount'),
      sumInRange(Expense, inRange, 'amount'),
      sumInRange(Purchase, inRange, 'totalAmount'),
      // Outstanding dues are the current balance, not limited to the date range
      sumInRange(Invoice, { ...baseQuery, status: { $in: ['issued', 'partial'] } }, 'balanceDue'),
      trendInRange(ProductionEntry, inRange, 'quantityProduced', byMonth, start, end),
      trendInRange(Invoice, inRange, 'totalAmount', byMonth, start, end),
      trendInRange(Payment, inRange, 'amount', byMonth, start, end),
    ]);

    // Low stock materials (current stock, not date based)
    const lowStock = await Material.find({
      organization: orgId,
      $expr: { $lte: ['$currentStock', '$lowStockThreshold'] }
    }).select('name currentStock lowStockThreshold unit');

    const collectionByKey = Object.fromEntries(collectionTrend.map(r => [r._id, r.total]));

    res.json({
      success: true,
      data: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        groupBy: byMonth ? 'month' : 'day',
        production,
        sales,
        collection,
        expenses,
        purchases,
        outstanding,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock,
        productionTrend,
        salesTrend: salesTrend.map(r => ({ _id: r._id, sales: r.total, collection: collectionByKey[r._id] || 0 })),
      }
    });
  } catch (error) { next(error); }
};

const pcs = (n) => `${(n || 0).toLocaleString('en-IN')} pcs`;
const words = (s) => (s || '').replace(/_/g, ' ');

// @route GET /api/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=
// Every operation in the period (production, purchases, sales, payments received,
// payments made to vendors, expenses) as one list, newest first, with the period totals.
exports.getActivity = async (req, res, next) => {
  try {
    const { plant, from, to } = req.query;
    const { start, end } = parseRange(from, to);
    const query = { organization: req.user.organization._id, date: { $gte: start, $lte: end } };
    if (plant) query.plant = plant;

    const [production, purchases, invoices, payments, expenses, vendorPayments] = await Promise.all([
      ProductionEntry.find(query).populate('plant', 'name').populate('product', 'name').populate('materials.material', 'name').lean(),
      Purchase.find(query).populate('plant', 'name').populate('vendor', 'name').populate('items.material', 'name').lean(),
      Invoice.find(query).populate('plant', 'name').populate('customer', 'name').populate('items.product', 'name').lean(),
      Payment.find(query).populate('plant', 'name').populate('customer', 'name').populate('invoice', 'invoiceNumber').lean(),
      Expense.find(query).populate('plant', 'name').lean(),
      // Payments to vendors are not tied to a plant, so they are left out when one is selected
      plant ? [] : VendorPayment.find(query).populate('vendor', 'name').lean(),
    ]);

    const base = (type, doc) => ({ id: doc._id, type, date: doc.date, createdAt: doc.createdAt, plant: doc.plant?.name || '' });
    const join = (parts) => parts.filter(Boolean).join(' · ');

    const items = [
      ...production.map(p => ({
        ...base('production', p),
        title: p.product?.name || 'Production',
        detail: join([
          `${words(p.shift)} shift`,
          p.quantityDamaged ? `${p.quantityDamaged.toLocaleString('en-IN')} damaged` : '',
          (p.materials || []).length
            ? `Used ${p.materials.map(m => `${m.quantity} ${m.unit || ''} ${m.material?.name || ''}`.replace(/\s+/g, ' ').trim()).join(', ')}`
            : '',
        ]),
        quantity: p.quantityProduced,
      })),
      ...purchases.map(p => ({
        ...base('purchase', p),
        title: p.vendor?.name || 'Purchase',
        detail: join([
          (p.items || []).map(i => `${i.quantity} ${i.unit || ''} ${i.material?.name || ''}`.replace(/\s+/g, ' ').trim()).join(', '),
          p.billNumber ? `Bill ${p.billNumber}` : '',
          p.balanceDue > 0 ? `₹${p.balanceDue.toLocaleString('en-IN')} due` : 'Paid',
        ]),
        amount: p.totalAmount,
      })),
      ...invoices.map(i => ({
        ...base('sale', i),
        title: i.customer?.name || 'Sale',
        detail: join([
          i.invoiceNumber,
          (i.items || []).map(it => `${pcs(it.quantity)} ${it.product?.name || ''}`.trim()).join(', '),
          i.balanceDue > 0 ? `₹${i.balanceDue.toLocaleString('en-IN')} due` : 'Paid',
        ]),
        amount: i.totalAmount,
      })),
      ...payments.map(p => ({
        ...base('payment', p),
        title: p.customer?.name || 'Payment received',
        detail: join([words(p.mode), p.invoice?.invoiceNumber ? `for ${p.invoice.invoiceNumber}` : '', p.referenceNumber ? `Ref ${p.referenceNumber}` : '']),
        amount: p.amount,
      })),
      ...vendorPayments.map(p => ({
        ...base('vendor_payment', p),
        title: p.vendor?.name || 'Payment made',
        detail: join([words(p.mode), p.referenceNumber ? `Ref ${p.referenceNumber}` : '', p.notes]),
        amount: p.amount,
      })),
      ...expenses.map(e => ({
        ...base('expense', e),
        title: e.category,
        detail: join([e.description, words(e.paymentMode)]),
        amount: e.amount,
      })),
    ].sort((a, b) => (new Date(b.date) - new Date(a.date)) || (new Date(b.createdAt) - new Date(a.createdAt)));

    const sum = (list, pick) => list.reduce((s, x) => s + (pick(x) || 0), 0);
    res.json({
      success: true,
      data: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        totals: {
          production: sum(production, p => p.quantityProduced),
          purchases: sum(purchases, p => p.totalAmount),
          sales: sum(invoices, i => i.totalAmount),
          collection: sum(payments, p => p.amount),
          expenses: sum(expenses, e => e.amount),
        },
        items,
      }
    });
  } catch (error) { next(error); }
};
