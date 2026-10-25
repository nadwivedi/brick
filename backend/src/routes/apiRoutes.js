const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Party = require('../models/Party');
const Organization = require('../models/Organization');
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
const VendorPayment = require('../models/VendorPayment');
const StockMovement = require('../models/StockMovement');
const { getSummary, getActivity, getProfitLoss, parseRange } = require('../controllers/dashboardController');
const { getBrickStock, getBrickLedger } = require('../utils/brickStock');
const { pickAccount, modeFor } = require('../utils/accounts');
const { describeTransport, cleanTripRates, VEHICLE_NUMBER_MAX, cleanVehicleNumber } = require('../utils/transport');
const Vehicle = require('../models/Vehicle');
const { HIRED_TRANSPORT, partyTotals, balanceChange, partyBalances } = require('../utils/partyBalances');

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
      // Only this business's own records, and they stay with it
      const { [orgField]: _org, _id, ...changes } = req.body;
      const item = await Model.findOneAndUpdate({ _id: req.params.id, [orgField]: req.user.organization._id }, changes, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { next(e); }
  });
  router.delete('/:id', async (req, res, next) => {
    try {
      const item = await Model.findOneAndDelete({ _id: req.params.id, [orgField]: req.user.organization._id });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
  });
  return router;
};

// Business settings
router.get('/settings', async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organization._id).select('settings').lean();
    res.json({ success: true, data: { platesEnabled: false, bricksPerPlate: 0, ...(org?.settings || {}) } });
  } catch (e) { next(e); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const platesEnabled = req.body.platesEnabled === true || req.body.platesEnabled === 'true';
    const bricksPerPlate = Number(req.body.bricksPerPlate) || 0;
    if (platesEnabled && !(bricksPerPlate > 0)) {
      return res.status(400).json({ success: false, message: 'Enter how many bricks one plate makes' });
    }
    if (bricksPerPlate < 0) return res.status(400).json({ success: false, message: 'Bricks per plate cannot be negative' });
    const org = await Organization.findByIdAndUpdate(
      req.user.organization._id,
      { 'settings.platesEnabled': platesEnabled, 'settings.bricksPerPlate': bricksPerPlate },
      { new: true, runValidators: true }
    ).select('settings').lean();
    res.json({ success: true, data: org.settings });
  } catch (e) { next(e); }
});

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

// Plants: the default plant comes first, and there is always one (see Plant.ensureDefault)
router.get('/plants', async (req, res, next) => {
  try {
    const { organization } = req.user;
    await Plant.ensureDefault(organization._id, organization.name);
    const plants = await Plant.find({ organization: organization._id }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: plants });
  } catch (e) { next(e); }
});

router.put('/plants/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const plant = await Plant.findOne({ _id: req.params.id, organization });
    if (!plant) return res.status(404).json({ success: false, message: 'Not found' });
    const { name, address, gstin, mobile, isActive, isDefault } = req.body;
    if (name !== undefined) plant.name = name;
    if (address !== undefined) plant.address = address;
    if (gstin !== undefined) plant.gstin = gstin;
    if (mobile !== undefined) plant.mobile = mobile;
    if (isActive !== undefined) plant.isActive = isActive;
    if (isDefault === true || isDefault === 'true') {
      // Only one default: this one takes over, and it can't be inactive
      await Plant.updateMany({ organization, _id: { $ne: plant._id } }, { isDefault: false });
      plant.isDefault = true;
      plant.isActive = true;
    }
    if (plant.isDefault && (plant.isActive === false || plant.isActive === 'false')) {
      return res.status(400).json({ success: false, message: 'The default plant cannot be inactive. Make another plant the default first.' });
    }
    await plant.save();
    res.json({ success: true, data: plant });
  } catch (e) { next(e); }
});

router.delete('/plants/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const plant = await Plant.findOne({ _id: req.params.id, organization });
    if (!plant) return res.status(404).json({ success: false, message: 'Not found' });
    if (plant.isDefault) return res.status(400).json({ success: false, message: 'The default plant cannot be deleted. Make another plant the default first.' });
    const [production, sales, purchases] = await Promise.all([
      ProductionEntry.countDocuments({ organization, plant: plant._id }),
      Invoice.countDocuments({ organization, plant: plant._id }),
      Purchase.countDocuments({ organization, plant: plant._id }),
    ]);
    if (production + sales + purchases > 0) {
      return res.status(400).json({ success: false, message: `This plant has ${production} production, ${sales} sale and ${purchases} purchase entries. Mark it inactive instead.` });
    }
    await plant.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// Parties: anyone you sell to or buy from. A party with entries can't be deleted.
router.delete('/parties/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const party = await Party.findOne({ _id: req.params.id, organization });
    if (!party) return res.status(404).json({ success: false, message: 'Not found' });
    const [sales, purchases, received, paid] = await Promise.all([
      Invoice.countDocuments({ organization, customer: party._id }),
      Purchase.countDocuments({ organization, vendor: party._id }),
      Payment.countDocuments({ organization, customer: party._id }),
      VendorPayment.countDocuments({ organization, vendor: party._id }),
    ]);
    if (sales + purchases + received + paid > 0) {
      return res.status(400).json({ success: false, message: `${party.name} has ${sales} sale, ${purchases} purchase and ${received + paid} payment entries. Mark the party inactive instead.` });
    }
    await party.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});
router.use('/parties', makeCRUD(Party));
router.use('/workers', makeCRUD(Worker));

// Vehicles: one number per business; "my vehicle" has no owner party
router.use('/vehicles', async (req, res, next) => {
  if (!['POST', 'PUT'].includes(req.method)) return next();
  try {
    const organization = req.user.organization._id;
    const vehicleNumber = cleanVehicleNumber(req.body.vehicleNumber);
    if (!vehicleNumber) return res.status(400).json({ success: false, message: 'Enter the vehicle number' });
    if (vehicleNumber.length > VEHICLE_NUMBER_MAX) return res.status(400).json({ success: false, message: `Vehicle number can be at most ${VEHICLE_NUMBER_MAX} characters` });
    const id = req.path.slice(1);
    const taken = await Vehicle.exists({ organization, vehicleNumber, ...(id ? { _id: { $ne: id } } : {}) });
    if (taken) return res.status(409).json({ success: false, message: `Vehicle ${vehicleNumber} is already added` });
    const ownership = ['party', 'own', 'hired'].includes(req.body.ownership) ? req.body.ownership : 'party';
    if (ownership === 'hired' && !req.body.party) return res.status(400).json({ success: false, message: 'Select the transporter this vehicle is hired from' });
    req.body = {
      ...req.body, vehicleNumber, ownership,
      party: ownership === 'own' ? null : req.body.party || null,
      hireRate: Math.max(0, Number(req.body.hireRate) || 0),
      tripRates: cleanTripRates(req.body.tripRates),
    };
    next();
  } catch (e) { next(e); }
}, makeCRUD(Vehicle));
router.use('/products', makeCRUD(Product));
router.use('/materials', makeCRUD(Material));
router.use('/plants', makeCRUD(Plant));
// An expense is paid from a cash / bank account; the mode follows that account
router.use('/expenses', async (req, res, next) => {
  if (!['POST', 'PUT'].includes(req.method)) return next();
  try {
    const account = await pickAccount(req.user.organization._id, req.body.account);
    req.body = { ...req.body, account: account._id, paymentMode: modeFor(account, req.body.paymentMode) };
    next();
  } catch (e) { next(e); }
}, makeCRUD(Expense));
router.use('/payments', makeCRUD(Payment));

// Money received from parties. Every receipt is a Payment, so it shows up in the party's
// ledger, the party balances, the dashboard collection and the activity center.
// The list also includes payments taken on the Sales screen against an invoice.
// The money goes into the chosen cash / bank account; for a bank account the mode says how (UPI, bank, cheque).
router.get('/receipts', async (req, res, next) => {
  try {
    const receipts = await Payment.find({ organization: req.user.organization._id })
      .populate('customer', 'name mobile')
      .populate('invoice', 'invoiceNumber')
      .populate('account', 'name type')
      .sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: receipts });
  } catch (e) { next(e); }
});

router.post('/receipts', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { customer: customerId, mode, date, referenceNumber, notes } = req.body;
    const amount = Number(req.body.amount);
    if (!customerId) return res.status(400).json({ success: false, message: 'Select a party' });
    if (!(amount > 0)) return res.status(400).json({ success: false, message: 'Enter an amount above zero' });
    const customer = await Party.findOne({ _id: customerId, organization });
    if (!customer) return res.status(404).json({ success: false, message: 'Party not found' });
    const account = await pickAccount(organization, req.body.account);

    const receipt = await Payment.create({
      date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : new Date().toISOString().slice(0, 10),
      customer: customer._id,
      amount,
      account: account._id,
      mode: modeFor(account, mode),
      referenceNumber: (referenceNumber || '').trim() || undefined,
      notes: (notes || '').trim() || undefined,
      createdBy: req.user._id,
      organization,
    });
    res.status(201).json({ success: true, data: receipt });
  } catch (e) { next(e); }
});

// The changes an edit form sends for money received or paid, checked like a new entry
const paymentEdit = async (organization, body, partyKey) => {
  const amount = Number(body.amount);
  if (!body[partyKey]) return { error: 'Select a party' };
  if (!(amount > 0)) return { error: 'Enter an amount above zero' };
  const party = await Party.findOne({ _id: body[partyKey], organization });
  if (!party) return { error: 'Party not found', status: 404 };
  const account = await pickAccount(organization, body.account);
  return {
    fields: {
      [partyKey]: party._id, amount, account: account._id, mode: modeFor(account, body.mode),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? { date: body.date } : {}),
      referenceNumber: (body.referenceNumber || '').trim() || undefined,
      notes: (body.notes || '').trim() || undefined,
    },
  };
};

router.put('/receipts/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const receipt = await Payment.findOne({ _id: req.params.id, organization });
    if (!receipt) return res.status(404).json({ success: false, message: 'Not found' });
    const { fields, error, status } = await paymentEdit(organization, req.body, 'customer');
    if (error) return res.status(status || 400).json({ success: false, message: error });
    // Money taken with an invoice belongs to that invoice's party; the invoice's paid amount follows the edit
    if (receipt.invoice) {
      if (String(fields.customer) !== String(receipt.customer)) {
        return res.status(400).json({ success: false, message: 'This money was received with a sale. Change the party on the sale instead.' });
      }
      const invoice = await Invoice.findOne({ _id: receipt.invoice, organization });
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - receipt.amount + fields.amount);
        invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
        await invoice.save();
      }
    }
    receipt.set(fields);
    await receipt.save();
    res.json({ success: true, data: receipt });
  } catch (e) { next(e); }
});

router.delete('/receipts/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const receipt = await Payment.findOne({ _id: req.params.id, organization });
    if (!receipt) return res.status(404).json({ success: false, message: 'Not found' });
    // A payment taken against an invoice: the invoice goes back to being unpaid by that much
    if (receipt.invoice) {
      const invoice = await Invoice.findOne({ _id: receipt.invoice, organization });
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - receipt.amount);
        invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
        if (!['draft', 'cancelled'].includes(invoice.status)) {
          invoice.status = invoice.balanceDue <= 0 ? 'paid' : invoice.paidAmount > 0 ? 'partial' : 'issued';
        }
        await invoice.save();
      }
    }
    await receipt.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// Money paid to parties. Every payment shows up in the party's ledger, the party balances
// and the activity center. The list also includes the amount paid on the Purchases screen
// along with a purchase; those rows carry `purchase` and are changed from the purchase itself.
router.get('/vendor-payments', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const [payments, purchases] = await Promise.all([
      VendorPayment.find({ organization }).populate('vendor', 'name mobile').populate('account', 'name type').lean(),
      Purchase.find({ organization, paidAmount: { $gt: 0 } }).populate('vendor', 'name mobile').populate('account', 'name type').lean(),
    ]);
    const rows = [
      ...payments,
      ...purchases.map(p => ({
        _id: p._id, date: p.date, createdAt: p.createdAt, vendor: p.vendor,
        amount: p.paidAmount, mode: p.paymentMode, account: p.account,
        purchase: { _id: p._id, billNumber: p.billNumber },
      })),
    ].sort((a, b) => (new Date(b.date) - new Date(a.date)) || (new Date(b.createdAt) - new Date(a.createdAt)));
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/vendor-payments', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { vendor: vendorId, mode, date, referenceNumber, notes } = req.body;
    const amount = Number(req.body.amount);
    if (!vendorId) return res.status(400).json({ success: false, message: 'Select a party' });
    if (!(amount > 0)) return res.status(400).json({ success: false, message: 'Enter an amount above zero' });
    const vendor = await Party.findOne({ _id: vendorId, organization });
    if (!vendor) return res.status(404).json({ success: false, message: 'Party not found' });
    const account = await pickAccount(organization, req.body.account);

    const payment = await VendorPayment.create({
      date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : new Date().toISOString().slice(0, 10),
      vendor: vendor._id,
      amount,
      account: account._id,
      mode: modeFor(account, mode),
      referenceNumber: (referenceNumber || '').trim() || undefined,
      notes: (notes || '').trim() || undefined,
      createdBy: req.user._id,
      organization,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (e) { next(e); }
});

// Only money paid on account is edited here; an amount paid with a purchase is changed from the purchase
router.put('/vendor-payments/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const payment = await VendorPayment.findOne({ _id: req.params.id, organization });
    if (!payment) return res.status(404).json({ success: false, message: 'Not found. A payment made with a purchase is changed from the purchase.' });
    const { fields, error, status } = await paymentEdit(organization, req.body, 'vendor');
    if (error) return res.status(status || 400).json({ success: false, message: error });
    payment.set(fields);
    await payment.save();
    res.json({ success: true, data: payment });
  } catch (e) { next(e); }
});

router.delete('/vendor-payments/:id', async (req, res, next) => {
  try {
    const payment = await VendorPayment.findOne({ _id: req.params.id, organization: req.user.organization._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
    await payment.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// The account and mode for the amount paid with a purchase: nothing paid is 'credit'
const paidFrom = async (organization, body) => {
  if (!(Number(body.paidAmount) > 0)) return { account: null, paymentMode: 'credit' };
  const account = await pickAccount(organization, body.account);
  return { account: account._id, paymentMode: modeFor(account, body.paymentMode) };
};

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

// Fields the purchase form may set
const PURCHASE_FIELDS = ['date', 'vendor', 'plant', 'totalAmount', 'transportCharges', 'paidAmount', 'billNumber', 'notes'];

// The purchase as saved: each item in the material's own stock unit, whatever unit the client sent,
// with how it was paid and what was left on credit
const purchaseBody = async (organization, body) => {
  const units = await Material.unitMap((body.items || []).map(i => i.material), organization);
  const items = (body.items || []).map(i => ({
    material: i.material, quantity: Number(i.quantity) || 0, rate: Number(i.rate) || 0,
    amount: Number(i.amount) || 0, unit: units.get(String(i.material)) || i.unit,
  }));
  const fields = Object.fromEntries(PURCHASE_FIELDS.filter(k => k in body).map(k => [k, body[k]]));
  const bill = (Number(fields.totalAmount) || 0) + (Number(fields.transportCharges) || 0);
  return { ...fields, items, ...(await paidFrom(organization, body)), balanceDue: bill - (Number(fields.paidAmount) || 0) };
};

// Adds a purchase's materials to stock, or takes them back out (sign -1) when it is changed or deleted
const purchaseStock = async (purchase, sign = 1) => {
  for (const item of purchase.items) {
    await Material.findByIdAndUpdate(item.material, { $inc: { currentStock: sign * item.quantity } });
  }
  if (sign < 0) {
    await StockMovement.deleteMany({ organization: purchase.organization, refType: 'purchase', refId: purchase._id });
    return;
  }
  await StockMovement.insertMany(purchase.items.map(item => ({
    date: purchase.date, plant: purchase.plant, itemType: 'material', itemId: item.material,
    qtyIn: item.quantity, unit: item.unit, refType: 'purchase', refId: purchase._id, organization: purchase.organization,
  })));
};

router.post('/purchases', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const purchase = await Purchase.create({ ...(await purchaseBody(organization, req.body)), createdBy: req.user._id, organization });
    await purchaseStock(purchase);
    res.status(201).json({ success: true, data: purchase });
  } catch (e) { next(e); }
});

// Editing a purchase swaps its old materials in stock for the new ones; the party ledger reads
// the purchase itself, so its bill and what was paid with it follow the edit
router.put('/purchases/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const existing = await Purchase.findOne({ _id: req.params.id, organization });
    if (!existing) return res.status(404).json({ success: false, message: 'Purchase not found' });
    const body = await purchaseBody(organization, req.body);
    if (!body.items.length) return res.status(400).json({ success: false, message: 'Add at least one material' });
    await purchaseStock(existing, -1);
    const purchase = await Purchase.findByIdAndUpdate(existing._id, body, { new: true, runValidators: true });
    await purchaseStock(purchase);
    res.json({ success: true, data: purchase });
  } catch (e) { next(e); }
});

router.delete('/purchases/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const purchase = await Purchase.findOneAndDelete({ _id: req.params.id, organization });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    // The materials it brought in leave stock with it
    await purchaseStock(purchase, -1);
    res.json({ success: true });
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

// Brick stock per brick type (opening + good bricks produced - sold). Optional ?plant= limits it to one plant.
router.get('/stock/bricks', async (req, res, next) => {
  try {
    // ?excludeInvoice= leaves a sale being edited out, so its own bricks count as available
    const { plant, excludeInvoice } = req.query;
    const data = await getBrickStock(req.user.organization._id, { plant, excludeInvoice: mongoose.isValidObjectId(excludeInvoice) ? excludeInvoice : undefined });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Ledger for one brick type: production in, sales out, balance after each. Optional ?plant=&from=&to=
router.get('/stock/bricks/:productId/ledger', async (req, res, next) => {
  try {
    const { plant, from, to } = req.query;
    const data = await getBrickLedger(req.user.organization._id, req.params.productId, { plant, from, to });
    if (!data) return res.status(404).json({ success: false, message: 'Brick type not found' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Manual stock adjustment: add to or take away from a material's stock by hand, with a reason.
// Recorded as a stock movement so it shows in the material's ledger.
router.post('/stock/adjust', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { material: materialId, type, reason, notes, date } = req.body;
    const quantity = Number(req.body.quantity);
    if (!['increase', 'decrease'].includes(type)) return res.status(400).json({ success: false, message: 'Choose increase or decrease' });
    if (!(quantity > 0)) return res.status(400).json({ success: false, message: 'Enter a quantity above zero' });
    const material = await Material.findOne({ _id: materialId, organization });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    if (type === 'decrease' && quantity > (material.currentStock || 0)) {
      return res.status(400).json({ success: false, message: `Only ${material.currentStock || 0} ${material.unit} in stock` });
    }

    const change = type === 'increase' ? quantity : -quantity;
    const updated = await Material.findByIdAndUpdate(material._id, { $inc: { currentStock: change } }, { new: true });
    const movement = await StockMovement.create({
      date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : new Date().toISOString().slice(0, 10),
      itemType: 'material',
      itemId: material._id,
      qtyIn: type === 'increase' ? quantity : 0,
      qtyOut: type === 'decrease' ? quantity : 0,
      unit: material.unit,
      refType: 'adjustment',
      notes: [(reason || '').trim() || 'Stock adjustment', (notes || '').trim()].filter(Boolean).join(' — '),
      organization,
    });
    res.status(201).json({ success: true, data: { material: updated, movement } });
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

    const [purchases, production, adjustments] = await Promise.all([
      Purchase.find({ organization, 'items.material': material._id })
        .populate('vendor', 'name').populate('plant', 'name').lean(),
      ProductionEntry.find({ organization, 'materials.material': material._id })
        .populate('product', 'name').populate('plant', 'name').lean(),
      StockMovement.find({ organization, itemType: 'material', itemId: material._id, refType: 'adjustment' }).lean(),
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
      // Manual stock adjustments: notes hold "reason — extra note"
      ...adjustments.map(a => ({
        type: 'adjustment', refId: a._id, date: a.date, createdAt: a.createdAt, plant: '',
        party: (a.notes || '').split(' — ')[0] || 'Stock adjustment',
        detail: (a.notes || '').split(' — ').slice(1).join(' — '),
        qtyIn: a.qtyIn || 0, qtyOut: a.qtyOut || 0,
      })),
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

// Everything recorded against one party, oldest first, one row per entry like a ledger book.
// The balance runs from the party's side: positive = they owe us (receivable), negative = we owe them (payable).
// Each row's impact on the balance is debit - credit:
//  - a sale is debited in full and the money taken with it credited (amount / paidAmount / due)
//  - a purchase is credited in full and the money paid with it debited
//  - money received is a credit, money paid a debit, their vehicle hired for a sale a credit
const partyRows = async (organization, partyId) => {
  const words = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const join = (parts) => parts.filter(Boolean).join(' · ');
  const num = (n) => (n || 0).toLocaleString('en-IN');
  const [invoices, received, purchases, paid, hired] = await Promise.all([
    Invoice.find({ organization, customer: partyId, status: { $nin: ['draft', 'cancelled'] } })
      .populate('plant', 'name').populate('items.product', 'name').lean(),
    Payment.find({ organization, customer: partyId }).populate('plant', 'name').populate('invoice', 'invoiceNumber createdAt').lean(),
    Purchase.find({ organization, vendor: partyId }).populate('plant', 'name').populate('items.material', 'name').lean(),
    VendorPayment.find({ organization, vendor: partyId }).lean(),
    Invoice.find({ ...HIRED_TRANSPORT, organization, transporter: partyId }).populate('plant', 'name').populate('customer', 'name').lean(),
  ]);

  // The money taken with a sale: tagged atSale, or (older sales) its linked payment made within a minute of it
  const atSale = new Map();
  for (const p of received) {
    const inv = p.invoice;
    if (!inv || atSale.has(String(inv._id))) continue;
    const gap = new Date(p.createdAt) - new Date(inv.createdAt);
    if (p.atSale || (gap >= 0 && gap <= 60 * 1000)) atSale.set(String(inv._id), p);
  }
  const atSaleIds = new Set([...atSale.values()].map(p => String(p._id)));

  return [
    ...invoices.map(i => {
      const pay = atSale.get(String(i._id));
      const pcs = (i.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      return {
        type: 'sale', label: 'Sale', refId: i._id, date: i.date, createdAt: i.createdAt, plant: i.plant?.name || '',
        refNumber: i.invoiceNumber,
        item: (i.items || []).map(it => it.product?.name).filter(Boolean).join(', '),
        vehicle: i.vehicleNumber || '',
        quantity: pcs ? `${num(pcs)} pcs` : '', pcs,
        amount: i.totalAmount || 0, paidAmount: pay?.amount || 0,
        note: pay ? words(pay.mode) : '',
        debit: i.totalAmount || 0, credit: pay?.amount || 0,
      };
    }),
    ...received.filter(p => !atSaleIds.has(String(p._id))).map(p => ({
      type: 'received', label: 'Receipt', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
      refNumber: p.referenceNumber || '',
      item: join([words(p.mode), p.invoice?.invoiceNumber ? `for ${p.invoice.invoiceNumber}` : '']),
      vehicle: '', quantity: '', note: p.notes || '',
      amount: p.amount || 0, paidAmount: null,
      debit: 0, credit: p.amount || 0, order: 1,
    })),
    ...purchases.map(p => {
      const total = (p.totalAmount || 0) + (p.transportCharges || 0);
      const units = [...new Set((p.items || []).map(i => i.unit).filter(Boolean))];
      const qty = (p.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
      return {
        type: 'purchase', label: 'Purchase', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
        refNumber: p.billNumber ? `Bill ${p.billNumber}` : '',
        item: (p.items || []).map(i => i.material?.name).filter(Boolean).join(', '),
        vehicle: '',
        // Quantities only add up when they share a unit
        quantity: qty && units.length <= 1 ? `${num(qty)} ${units[0] || ''}`.trim() : '',
        amount: total, paidAmount: p.paidAmount || 0,
        note: p.paidAmount > 0 ? words(p.paymentMode) : '',
        debit: p.paidAmount || 0, credit: total,
      };
    }),
    ...hired.map(i => ({
      type: 'transport', label: 'Vehicle Hire', refId: i._id, date: i.date, createdAt: i.createdAt, plant: i.plant?.name || '',
      refNumber: i.invoiceNumber,
      item: join([i.transportLocation ? `To ${i.transportLocation}` : '', i.customer?.name ? `for ${i.customer.name}` : '']),
      vehicle: i.vehicleNumber || '',
      quantity: describeTransport(i.transportBasis, i.transportQty, i.transportRate, ''),
      amount: i.transportCost || 0, paidAmount: null, note: '',
      debit: 0, credit: i.transportCost || 0,
    })),
    ...paid.map(p => ({
      type: 'paid', label: 'Payment', refId: p._id, date: p.date, createdAt: p.createdAt, plant: '',
      refNumber: p.referenceNumber || '',
      item: words(p.mode), vehicle: '', quantity: '', note: p.notes || '',
      amount: p.amount || 0, paidAmount: null,
      debit: p.amount || 0, credit: 0,
    })),
  ].sort((a, b) => (new Date(a.date) - new Date(b.date)) || (new Date(a.createdAt) - new Date(b.createdAt)) || ((a.order || 0) - (b.order || 0)));
};

// Account ledger for one party, oldest first, with a running balance (see partyRows).
// Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD limits the rows; the opening balance is then the
// balance just before `from`.
router.get('/party-ledger/:id', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const party = await Party.findOne({ _id: req.params.id, organization });
    if (!party) return res.status(404).json({ success: false, message: 'Party not found' });

    const rows = await partyRows(organization, party._id);
    const start = party.openingBalance || 0;
    let balance = start;
    const all = rows.map(({ order, ...r }) => ({ ...r, balance: (balance += r.debit - r.credit) }));

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const from = DATE_RE.test(req.query.from || '') ? req.query.from : null;
    const to = DATE_RE.test(req.query.to || '') ? req.query.to : null;
    const dayOf = (r) => new Date(r.date).toISOString().slice(0, 10);
    const before = from ? all.filter(r => dayOf(r) < from) : [];
    const entries = all.filter(r => (!from || dayOf(r) >= from) && (!to || dayOf(r) <= to));
    const sum = (list, key) => list.reduce((s, r) => s + r[key], 0);
    const opening = start + sum(before, 'debit') - sum(before, 'credit');
    const totalDebit = sum(entries, 'debit');
    const totalCredit = sum(entries, 'credit');
    const of = (type) => entries.filter(r => r.type === type);
    const total = (list, key = 'amount') => list.reduce((s, r) => s + (r[key] || 0), 0);

    res.json({
      success: true,
      data: {
        party: { _id: party._id, name: party.name, mobile: party.mobile, address: party.address, gstin: party.gstin },
        from, to,
        opening, totalDebit, totalCredit, closing: opening + totalDebit - totalCredit,
        // Money taken with a sale counts as received, money paid with a purchase as paid
        sales: total(of('sale')), received: total(of('received')) + total(of('sale'), 'paidAmount'),
        purchases: total(of('purchase')) + total(of('transport')), paid: total(of('paid')) + total(of('purchase'), 'paidAmount'),
        bricksSold: total(of('sale'), 'pcs'),
        currentBalance: balance,
        entries,
      }
    });
  } catch (e) { next(e); }
});

// Totals per party for the list screens, keyed by id, with the balance
// (opening + sales - received - purchases + paid; positive = they owe us).
router.get('/party-balances', async (req, res, next) => {
  try {
    res.json({ success: true, data: await partyBalances(req.user.organization._id) });
  } catch (e) { next(e); }
});

// Party ledger report: every party with its opening balance at `from`, what happened
// between `from` and `to`, and the closing balance at `to`.
// @route GET /api/reports/party-ledger?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/reports/party-ledger', async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const { start, end } = parseRange(req.query.from, req.query.to);
    const [parties, beforeOf, duringOf] = await Promise.all([
      Party.find({ organization }).select('name mobile openingBalance isActive').sort({ name: 1 }).lean(),
      partyTotals(organization, { $lt: start }),
      partyTotals(organization, { $gte: start, $lte: end }),
    ]);
    const rows = parties.map(p => {
      const id = String(p._id);
      const during = duringOf(id);
      const opening = (p.openingBalance || 0) + balanceChange(beforeOf(id));
      return {
        _id: p._id, name: p.name, mobile: p.mobile, isActive: p.isActive,
        opening,
        sales: during.sales, received: during.received, purchases: during.purchases, paid: during.paid,
        closing: opening + balanceChange(during),
        hasActivity: during.salesCount + during.purchaseCount > 0 || during.received > 0 || during.paid > 0,
      };
    });
    const sum = (key) => rows.reduce((s, r) => s + r[key], 0);
    res.json({
      success: true,
      data: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        totals: {
          sales: sum('sales'), received: sum('received'), purchases: sum('purchases'), paid: sum('paid'),
          receivable: rows.reduce((s, r) => s + Math.max(r.closing, 0), 0),
          payable: rows.reduce((s, r) => s + Math.max(-r.closing, 0), 0),
        },
        rows,
      }
    });
  } catch (e) { next(e); }
});

// Profit & loss for a period
router.get('/reports/profit-loss', getProfitLoss);

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
