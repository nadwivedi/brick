const ProductionEntry = require('../models/ProductionEntry');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Material = require('../models/Material');
const Purchase = require('../models/Purchase');
const VendorPayment = require('../models/VendorPayment');
const Product = require('../models/Product');
const { receivablePayable } = require('../utils/partyBalances');

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

// Every day (or month, for long ranges) from start to end, as the keys the trends are grouped by
const periodKeys = (byMonth, start, end) => {
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
  return keys;
};

// Totals per day (or per month for long ranges), with empty periods filled with 0
const trendInRange = async (Model, match, field, byMonth, start, end) => {
  const format = byMonth ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format, date: '$date' } }, total: { $sum: `$${field}` } } }
  ]);
  const totals = Object.fromEntries(rows.map(r => [r._id, r.total]));
  return periodKeys(byMonth, start, end).map(k => ({ _id: k, total: totals[k] || 0 }));
};

// Bricks produced per period, split by brick type: [{ _id: period, total, [productId]: qty }]
const productionTrendByType = async (match, byMonth, start, end) => {
  const format = byMonth ? '%Y-%m' : '%Y-%m-%d';
  const rows = await ProductionEntry.aggregate([
    { $match: match },
    { $group: { _id: { period: { $dateToString: { format, date: '$date' } }, product: '$product' }, total: { $sum: '$quantityProduced' } } }
  ]);
  const byPeriod = {};
  for (const r of rows) {
    const row = (byPeriod[r._id.period] ||= { total: 0 });
    row[String(r._id.product)] = r.total;
    row.total += r.total;
  }
  return periodKeys(byMonth, start, end).map(k => ({ _id: k, total: 0, ...byPeriod[k] }));
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
      // Outstanding dues are what parties owe right now (their ledger balance), not limited to the
      // date range or a plant: money received later is recorded against the party, not a sale
      receivablePayable(orgId).then(r => r.receivable),
      productionTrendByType(inRange, byMonth, start, end),
      trendInRange(Invoice, inRange, 'totalAmount', byMonth, start, end),
      trendInRange(Payment, inRange, 'amount', byMonth, start, end),
    ]);

    // Brick types in the order they were created, so each keeps the same chart colour
    const productionTypes = await Product.find({ organization: orgId }).sort({ createdAt: 1, _id: 1 }).select('name').lean();

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
        productionTypes,
        salesTrend: salesTrend.map(r => ({ _id: r._id, sales: r.total, collection: collectionByKey[r._id] || 0 })),
      }
    });
  } catch (error) { next(error); }
};

// @route GET /api/reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
// Income is what was billed on sales (bricks + transport/loading - discount, GST left out as it
// is collected for the government). Costs are raw material bought (with its transport),
// vehicles hired to deliver sales, and expenses by category. Draft and cancelled invoices are not counted.
exports.getProfitLoss = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { start, end } = parseRange(req.query.from, req.query.to);
    const inRange = { organization, date: { $gte: start, $lte: end } };
    const sales = { ...inRange, status: { $nin: ['draft', 'cancelled'] } };

    const [brickSales, invoiceTotals, materials, purchaseTotals, expenses, production, hiredTransport] = await Promise.all([
      Invoice.aggregate([
        { $match: sales },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', quantity: { $sum: '$items.quantity' }, amount: { $sum: '$items.amount' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $project: { quantity: 1, amount: 1, name: { $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, 'Other'] } } },
        { $sort: { amount: -1 } },
      ]),
      Invoice.aggregate([
        { $match: sales },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          transport: { $sum: { $ifNull: ['$transportCharges', 0] } },
          loading: { $sum: { $ifNull: ['$loadingCharges', 0] } },
          discount: { $sum: { $ifNull: ['$discount', 0] } },
          gst: { $sum: { $ifNull: ['$gstTotal', 0] } },
        } },
      ]),
      Purchase.aggregate([
        { $match: inRange },
        { $unwind: '$items' },
        { $group: { _id: '$items.material', quantity: { $sum: '$items.quantity' }, amount: { $sum: '$items.amount' } } },
        { $lookup: { from: 'materials', localField: '_id', foreignField: '_id', as: 'material' } },
        { $project: {
          quantity: 1, amount: 1,
          name: { $ifNull: [{ $arrayElemAt: ['$material.name', 0] }, 'Other'] },
          unit: { $arrayElemAt: ['$material.unit', 0] },
        } },
        { $sort: { amount: -1 } },
      ]),
      Purchase.aggregate([
        { $match: inRange },
        { $group: { _id: null, count: { $sum: 1 }, transport: { $sum: { $ifNull: ['$transportCharges', 0] } } } },
      ]),
      Expense.aggregate([
        { $match: inRange },
        { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
      ]),
      sumInRange(ProductionEntry, inRange, 'quantityProduced'),
      // Owed to transporters for vehicles hired to deliver sales
      sumInRange(Invoice, { ...sales, transportMode: 'hired' }, 'transportCost'),
    ]);

    const sum = (list) => list.reduce((s, r) => s + (r.amount || 0), 0);
    const inv = invoiceTotals[0] || {};
    const pur = purchaseTotals[0] || {};

    const income = {
      bricks: brickSales.map(r => ({ name: r.name, quantity: r.quantity, amount: r.amount })),
      transport: inv.transport || 0,
      loading: inv.loading || 0,
      discount: inv.discount || 0,
      invoiceCount: inv.count || 0,
      gstCollected: inv.gst || 0,
    };
    income.total = sum(income.bricks) + income.transport + income.loading - income.discount;

    const costs = {
      materials: materials.map(r => ({ name: r.name, unit: r.unit || '', quantity: r.quantity, amount: r.amount })),
      purchaseTransport: pur.transport || 0,
      purchaseCount: pur.count || 0,
      expenses: expenses.map(r => ({ name: r._id || 'Other', amount: r.amount, count: r.count })),
      hiredTransport,
    };
    costs.materialTotal = sum(costs.materials) + costs.purchaseTransport;
    costs.expenseTotal = sum(costs.expenses);
    costs.total = costs.materialTotal + costs.expenseTotal + costs.hiredTransport;

    const netProfit = income.total - costs.total;
    res.json({
      success: true,
      data: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        income,
        costs,
        production,
        costPerBrick: production ? costs.total / production : 0,
        netProfit,
        margin: income.total ? (netProfit / income.total) * 100 : 0,
      }
    });
  } catch (error) { next(error); }
};

exports.parseRange = parseRange;

const pcs = (n) => `${(n || 0).toLocaleString('en-IN')} pcs`;
const words = (s) => (s || '').replace(/_/g, ' ');

// @route GET /api/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=
// Every operation in the period (production, purchases, sales, payments received,
// payments made to vendors, expenses) as one list, newest first, with the period totals.
// How a sale / purchase was paid at the time: in full (cash), in part, or not at all (credit)
const paidWith = (paid, total) => (
  !(paid > 0) ? 'Credit' : paid >= total ? 'Cash' : `₹${paid.toLocaleString('en-IN')} paid, rest on credit`
);

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
          paidWith(p.paidAmount, (p.totalAmount || 0) + (p.transportCharges || 0)),
        ]),
        amount: p.totalAmount,
      })),
      ...invoices.map(i => ({
        ...base('sale', i),
        title: i.customer?.name || 'Sale',
        detail: join([
          i.invoiceNumber,
          (i.items || []).map(it => `${pcs(it.quantity)} ${it.product?.name || ''}`.trim()).join(', '),
          paidWith(i.paidAmount, i.totalAmount),
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
