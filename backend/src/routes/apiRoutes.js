const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const Worker = require('../models/Worker');
const Product = require('../models/Product');
const Material = require('../models/Material');
const Unit = require('../models/Unit');
const ExpenseCategory = require('../models/ExpenseCategory');
const Plant = require('../models/Plant');
const Purchase = require('../models/Purchase');
const ProductionEntry = require('../models/ProductionEntry');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const StockMovement = require('../models/StockMovement');
const { getSummary, getActivity } = require('../controllers/dashboardController');

router.use(protect);

// Dashboard
router.get('/dashboard/summary', getSummary);

// Activity Center
router.get('/activity', getActivity);

// Generic CRUD factory
const makeCRUD = (Model, orgField = 'organization') => {
  const router = express.Router();
  router.get('/', async (req, res, next) => {
    try {
      const items = await Model.find({ [orgField]: req.user.organization._id }).sort({ createdAt: -1 });
      res.json({ success: true, data: items });
    } catch (e) { next(e); }
  });
  router.post('/', async (req, res, next) => {
    try {
      const item = await Model.create({ ...req.body, [orgField]: req.user.organization._id });
      res.status(201).json({ success: true, data: item });
    } catch (e) { next(e); }
  });
  router.get('/:id', async (req, res, next) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { next(e); }
  });
  router.put('/:id', async (req, res, next) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { next(e); }
  });
  router.delete('/:id', async (req, res, next) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
  });
  return router;
};

// Units (default units are created automatically for each organization)
router.get('/units', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    await Unit.ensureDefaults(organization);
    const units = await Unit.find({ organization }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: units });
  } catch (e) { next(e); }
});

// Validates unit name/code from the request body; returns an error message or null
const readUnitInput = (body) => {
  const name = (body.name || '').trim();
  const code = (body.code || '').trim().toUpperCase();
  if (!name) return { error: 'Unit name is required' };
  if (!code) return { error: 'Unit code is required' };
  return { name, code };
};

const duplicateUnitMessage = (e) =>
  e.keyPattern?.code ? 'A unit with this code already exists' : 'A unit with this name already exists';

router.post('/units', async (req, res, next) => {
  try {
    const { name, code, error } = readUnitInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const unit = await Unit.create({ name, code, organization: req.user.organization._id });
    res.status(201).json({ success: true, data: unit });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: duplicateUnitMessage(e) });
    next(e);
  }
});

router.put('/units/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { name, code, error } = readUnitInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const unit = await Unit.findOne({ _id: req.params.id, organization });
    if (!unit) return res.status(404).json({ success: false, message: 'Not found' });
    const oldName = unit.name;
    unit.name = name;
    unit.code = code;
    await unit.save();
    // Keep materials that use this unit in sync with the new name
    if (oldName !== name) await Material.updateMany({ organization, unit: oldName }, { unit: name });
    res.json({ success: true, data: unit });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: duplicateUnitMessage(e) });
    next(e);
  }
});

router.delete('/units/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const unit = await Unit.findOne({ _id: req.params.id, organization });
    if (!unit) return res.status(404).json({ success: false, message: 'Not found' });
    if (unit.isDefault) return res.status(400).json({ success: false, message: 'Default units cannot be deleted' });
    const inUse = await Material.countDocuments({ organization, unit: unit.name });
    if (inUse) return res.status(400).json({ success: false, message: `Unit is used by ${inUse} material(s)` });
    await unit.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

router.use('/customers', makeCRUD(Customer));
router.use('/vendors', makeCRUD(Vendor));
router.use('/workers', makeCRUD(Worker));
router.use('/products', makeCRUD(Product));
router.use('/materials', makeCRUD(Material));
router.use('/plants', makeCRUD(Plant));
router.use('/expenses', makeCRUD(Expense));
router.use('/payments', makeCRUD(Payment));

// Purchases with material stock update
router.get('/purchases', async (req, res, next) => {
  try {
    const { plant, vendor, from, to } = req.query;
    const query = { organization: req.user.organization._id };
    if (plant) query.plant = plant;
    if (vendor) query.vendor = vendor;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const purchases = await Purchase.find(query)
      .populate('vendor', 'name mobile')
      .populate('plant', 'name')
      .populate('items.material', 'name unit')
      .sort({ date: -1 });
    res.json({ success: true, data: purchases });
  } catch (e) { next(e); }
});

router.post('/purchases', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    // Record each item in the material's own stock unit, whatever unit the client sent
    const units = await Material.unitMap((req.body.items || []).map(i => i.material), organization);
    const items = (req.body.items || []).map(i => ({ ...i, unit: units.get(String(i.material)) || i.unit }));
    const purchase = await Purchase.create({
      ...req.body,
      items,
      balanceDue: req.body.totalAmount + (req.body.transportCharges || 0) - (req.body.paidAmount || 0),
      organization
    });
    // Update stock
    for (const item of items) {
      await Material.findByIdAndUpdate(item.material, { $inc: { currentStock: item.quantity } });
      await StockMovement.create({
        date: purchase.date,
        plant: purchase.plant,
        itemType: 'material',
        itemId: item.material,
        qtyIn: item.quantity,
        unit: item.unit,
        refType: 'purchase',
        refId: purchase._id,
        organization
      });
    }
    res.status(201).json({ success: true, data: purchase });
  } catch (e) { next(e); }
});

router.put('/purchases/:id', async (req, res, next) => {
  try {
    const p = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

router.delete('/purchases/:id', async (req, res, next) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Customer ledger
router.get('/customers/:id/ledger', async (req, res, next) => {
  try {
    const invoices = await require('../models/Invoice').find({ customer: req.params.id }).sort({ date: 1 });
    const payments = await Payment.find({ customer: req.params.id }).sort({ date: 1 });
    res.json({ success: true, data: { invoices, payments } });
  } catch (e) { next(e); }
});

// Stock summary
router.get('/stock/summary', async (req, res, next) => {
  try {
    const { plant } = req.query;
    const query = { organization: req.user.organization._id };
    if (plant) query.plant = plant;
    const materials = await Material.find(query);
    res.json({ success: true, data: materials });
  } catch (e) { next(e); }
});

// Stock ledger for one material: every purchase (in) and production use (out), oldest first,
// with a running balance. Built from the purchase and production records themselves so the
// whole history is covered. Whatever the records don't explain (opening stock entered on the
// material, manual edits) is shown as the opening balance, so the ledger closes on current stock.
router.get('/stock/ledger/:materialId', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const material = await Material.findOne({ _id: req.params.materialId, organization });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const [purchases, production] = await Promise.all([
      Purchase.find({ organization, 'items.material': material._id })
        .populate('vendor', 'name').populate('plant', 'name').lean(),
      ProductionEntry.find({ organization, 'materials.material': material._id })
        .populate('product', 'name').populate('plant', 'name').lean(),
    ]);

    const isThis = (row) => String(row.material) === String(material._id);
    const rows = [
      ...purchases.flatMap(p => p.items.filter(isThis).map(i => ({
        type: 'purchase', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
        party: p.vendor?.name || 'Purchase',
        detail: [p.billNumber ? `Bill ${p.billNumber}` : '', `₹${(i.rate || 0).toLocaleString('en-IN')} per ${material.unit}`].filter(Boolean).join(' · '),
        qtyIn: i.quantity || 0, qtyOut: 0,
      }))),
      ...production.flatMap(p => p.materials.filter(isThis).map(m => ({
        type: 'production', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
        party: p.product?.name || 'Production',
        detail: `Used to make ${(p.quantityProduced || 0).toLocaleString('en-IN')} pcs`,
        qtyIn: 0, qtyOut: m.quantity || 0,
      }))),
    ].sort((a, b) => (new Date(a.date) - new Date(b.date)) || (new Date(a.createdAt) - new Date(b.createdAt)));

    const sumIn = (list) => list.reduce((s, r) => s + r.qtyIn, 0);
    const sumOut = (list) => list.reduce((s, r) => s + r.qtyOut, 0);
    let balance = (material.currentStock || 0) - sumIn(rows) + sumOut(rows);
    const all = rows.map(r => ({ ...r, balance: (balance += r.qtyIn - r.qtyOut) }));

    // Optional date range (?from=YYYY-MM-DD&to=YYYY-MM-DD): the opening balance is then the
    // stock just before `from`, and the closing balance the stock at the end of `to`.
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const from = DATE_RE.test(req.query.from || '') ? req.query.from : null;
    const to = DATE_RE.test(req.query.to || '') ? req.query.to : null;
    const dayOf = (r) => new Date(r.date).toISOString().slice(0, 10);
    const before = from ? all.filter(r => dayOf(r) < from) : [];
    const entries = all.filter(r => (!from || dayOf(r) >= from) && (!to || dayOf(r) <= to));
    const totalIn = sumIn(entries);
    const totalOut = sumOut(entries);
    const opening = (material.currentStock || 0) - sumIn(rows) + sumOut(rows) + sumIn(before) - sumOut(before);

    res.json({
      success: true,
      data: {
        material: { _id: material._id, name: material.name, unit: material.unit, lowStockThreshold: material.lowStockThreshold },
        from, to,
        opening, totalIn, totalOut, closing: opening + totalIn - totalOut,
        currentStock: material.currentStock || 0,
        entries,
      }
    });
  } catch (e) { next(e); }
});

// Account ledger for a customer or a vendor, oldest first, with a running balance.
//  - customer: invoices raise what they owe us, payments received lower it
//  - vendor:   purchases raise what we owe them, amounts paid lower it
// The balance starts from the opening balance saved on the customer/vendor.
// Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD limits the rows; the opening balance is then the
// balance just before `from`.
router.get('/party-ledger/:type/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { type, id } = req.params;
    if (!['customer', 'vendor'].includes(type)) return res.status(404).json({ success: false, message: 'Not found' });
    const party = await (type === 'customer' ? Customer : Vendor).findOne({ _id: id, organization });
    if (!party) return res.status(404).json({ success: false, message: `${type === 'customer' ? 'Customer' : 'Vendor'} not found` });

    const money = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
    const words = (s) => (s || '').replace(/_/g, ' ');
    const join = (parts) => parts.filter(Boolean).join(' · ');
    let rows;

    if (type === 'customer') {
      const [invoices, payments] = await Promise.all([
        Invoice.find({ organization, customer: id, status: { $nin: ['draft', 'cancelled'] } })
          .populate('plant', 'name').populate('items.product', 'name').lean(),
        Payment.find({ organization, customer: id }).populate('plant', 'name').populate('invoice', 'invoiceNumber').lean(),
      ]);
      rows = [
        ...invoices.map(i => ({
          type: 'sale', refId: i._id, date: i.date, createdAt: i.createdAt, plant: i.plant?.name || '',
          title: `Invoice ${i.invoiceNumber}`,
          detail: join([
            (i.items || []).map(it => `${(it.quantity || 0).toLocaleString('en-IN')} pcs ${it.product?.name || ''} @ ${money(it.rate)}`.trim()).join(', '),
            i.vehicleNumber ? `Vehicle ${i.vehicleNumber}` : '',
          ]),
          increase: i.totalAmount || 0, decrease: 0,
        })),
        ...payments.map(p => ({
          type: 'payment', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
          title: 'Payment received',
          detail: join([words(p.mode), p.invoice?.invoiceNumber ? `for ${p.invoice.invoiceNumber}` : '', p.referenceNumber ? `Ref ${p.referenceNumber}` : '', p.notes]),
          increase: 0, decrease: p.amount || 0,
        })),
      ];
    } else {
      const purchases = await Purchase.find({ organization, vendor: id })
        .populate('plant', 'name').populate('items.material', 'name').lean();
      rows = purchases.flatMap(p => [
        {
          type: 'purchase', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
          title: p.billNumber ? `Purchase · Bill ${p.billNumber}` : 'Purchase',
          detail: join([
            (p.items || []).map(i => `${i.quantity} ${i.unit || ''} ${i.material?.name || ''} @ ${money(i.rate)}`.replace(/\s+/g, ' ').trim()).join(', '),
            p.transportCharges ? `Transport ${money(p.transportCharges)}` : '',
          ]),
          increase: (p.totalAmount || 0) + (p.transportCharges || 0), decrease: 0, order: 0,
        },
        ...(p.paidAmount > 0 ? [{
          type: 'payment', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
          title: 'Payment made',
          detail: join([words(p.paymentMode), p.billNumber ? `for Bill ${p.billNumber}` : '']),
          increase: 0, decrease: p.paidAmount, order: 1,
        }] : []),
      ]);
    }

    rows.sort((a, b) => (new Date(a.date) - new Date(b.date)) || (new Date(a.createdAt) - new Date(b.createdAt)) || ((a.order || 0) - (b.order || 0)));
    const start = party.openingBalance || 0;
    let balance = start;
    const all = rows.map(({ order, ...r }) => ({ ...r, balance: (balance += r.increase - r.decrease) }));

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const from = DATE_RE.test(req.query.from || '') ? req.query.from : null;
    const to = DATE_RE.test(req.query.to || '') ? req.query.to : null;
    const dayOf = (r) => new Date(r.date).toISOString().slice(0, 10);
    const before = from ? all.filter(r => dayOf(r) < from) : [];
    const entries = all.filter(r => (!from || dayOf(r) >= from) && (!to || dayOf(r) <= to));
    const sum = (list, key) => list.reduce((s, r) => s + r[key], 0);
    const opening = start + sum(before, 'increase') - sum(before, 'decrease');
    const totalIncrease = sum(entries, 'increase');
    const totalDecrease = sum(entries, 'decrease');

    res.json({
      success: true,
      data: {
        type,
        party: { _id: party._id, name: party.name, mobile: party.mobile, address: party.address, gstin: party.gstin },
        from, to,
        opening, totalIncrease, totalDecrease, closing: opening + totalIncrease - totalDecrease,
        currentBalance: balance,
        entries,
      }
    });
  } catch (e) { next(e); }
});

// Totals per customer or vendor for the list screens: how much was billed, how much was paid,
// and the balance still due (opening balance + billed - paid), keyed by id.
router.get('/party-balances/:type', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { type } = req.params;
    if (!['customer', 'vendor'].includes(type)) return res.status(404).json({ success: false, message: 'Not found' });
    const byId = (rows) => Object.fromEntries(rows.map(r => [String(r._id), r]));

    let parties, billed, paid;
    if (type === 'customer') {
      [parties, billed, paid] = await Promise.all([
        Customer.find({ organization }).select('openingBalance').lean(),
        Invoice.aggregate([
          { $match: { organization, status: { $nin: ['draft', 'cancelled'] } } },
          { $group: { _id: '$customer', total: { $sum: '$totalAmount' }, count: { $sum: 1 }, lastDate: { $max: '$date' } } },
        ]),
        Payment.aggregate([
          { $match: { organization } },
          { $group: { _id: '$customer', total: { $sum: '$amount' } } },
        ]),
      ]);
    } else {
      [parties, billed] = await Promise.all([
        Vendor.find({ organization }).select('openingBalance').lean(),
        Purchase.aggregate([
          { $match: { organization } },
          { $group: {
            _id: '$vendor',
            total: { $sum: { $add: ['$totalAmount', { $ifNull: ['$transportCharges', 0] }] } },
            paid: { $sum: { $ifNull: ['$paidAmount', 0] } },
            count: { $sum: 1 }, lastDate: { $max: '$date' },
          } },
        ]),
      ]);
      paid = billed.map(b => ({ _id: b._id, total: b.paid }));
    }

    const billedById = byId(billed);
    const paidById = byId(paid);
    const data = Object.fromEntries(parties.map(p => {
      const b = billedById[String(p._id)];
      const billedTotal = b?.total || 0;
      const paidTotal = paidById[String(p._id)]?.total || 0;
      return [String(p._id), {
        billed: billedTotal, paid: paidTotal,
        balance: (p.openingBalance || 0) + billedTotal - paidTotal,
        count: b?.count || 0, lastDate: b?.lastDate || null,
      }];
    }));
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Expense categories (default categories are created automatically for each organization)
const readCategoryName = (body) => (body.name || '').trim();

router.get('/expense-categories', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    await ExpenseCategory.ensureDefaults(organization);
    const categories = await ExpenseCategory.find({ organization }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (e) { next(e); }
});

router.post('/expense-categories', async (req, res, next) => {
  try {
    const name = readCategoryName(req.body);
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const category = await ExpenseCategory.create({
      name, description: (req.body.description || '').trim(), organization: req.user.organization._id
    });
    res.status(201).json({ success: true, data: category });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'This category already exists' });
    next(e);
  }
});

router.put('/expense-categories/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const name = readCategoryName(req.body);
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const category = await ExpenseCategory.findOne({ _id: req.params.id, organization });
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    const oldName = category.name;
    category.name = name;
    category.description = (req.body.description || '').trim();
    await category.save();
    // Keep existing expenses in sync with the new name
    if (oldName !== name) await Expense.updateMany({ organization, category: oldName }, { category: name });
    res.json({ success: true, data: category });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'This category already exists' });
    next(e);
  }
});

router.delete('/expense-categories/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const category = await ExpenseCategory.findOne({ _id: req.params.id, organization });
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    if (category.isDefault) return res.status(400).json({ success: false, message: 'Default categories cannot be deleted' });
    const inUse = await Expense.countDocuments({ organization, category: category.name });
    if (inUse) return res.status(400).json({ success: false, message: `Category is used by ${inUse} expense(s)` });
    await category.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
