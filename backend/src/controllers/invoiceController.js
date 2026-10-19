const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { checkBrickStock, NOT_SOLD } = require('../utils/brickStock');

// @route GET /api/invoices
exports.getAll = async (req, res, next) => {
  try {
    const { customer, status, from, to, page = 1, limit = 20 } = req.query;
    const query = { organization: req.user.organization._id };
    if (customer) query.customer = customer;
    if (status) query.status = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const invoices = await Invoice.find(query)
      .populate('customer', 'name mobile')
      .populate('plant', 'name')
      .populate('items.product', 'name unit')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Invoice.countDocuments(query);
    res.json({ success: true, data: invoices, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// @route POST /api/invoices
exports.create = async (req, res, next) => {
  try {
    // Bricks can't be sold beyond what is in stock
    if (!NOT_SOLD.includes(req.body.status)) {
      const shortage = await checkBrickStock(req.user.organization._id, req.body.items);
      if (shortage) return res.status(400).json({ success: false, message: shortage });
    }

    // Generate invoice number
    const count = await Invoice.countDocuments({ organization: req.user.organization._id });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      balanceDue: req.body.totalAmount - (req.body.paidAmount || 0),
      createdBy: req.user._id,
      organization: req.user.organization._id
    });

    if (invoice.paidAmount > 0) {
      await Payment.create({
        date: invoice.date,
        customer: invoice.customer,
        invoice: invoice._id,
        amount: invoice.paidAmount,
        mode: req.body.paymentMode || 'cash',
        createdBy: req.user._id,
        organization: req.user.organization._id,
        plant: invoice.plant
      });
    }

    const populated = await invoice.populate(['customer', 'plant', 'items.product']);
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @route GET /api/invoices/:id
exports.getOne = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer plant items.product createdBy');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

// @route PUT /api/invoices/:id
exports.update = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const existing = await Invoice.findOne({ _id: req.params.id, organization });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Re-check stock when the edit changes what is sold (new items, or a draft/cancelled invoice issued)
    const status = req.body.status || existing.status;
    const itemsChanged = Array.isArray(req.body.items);
    const nowSold = NOT_SOLD.includes(existing.status) && !NOT_SOLD.includes(status);
    if (!NOT_SOLD.includes(status) && (itemsChanged || nowSold)) {
      const shortage = await checkBrickStock(organization, itemsChanged ? req.body.items : existing.items, { excludeInvoice: existing._id });
      if (shortage) return res.status(400).json({ success: false, message: shortage });
    }

    const invoice = await Invoice.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

// @route DELETE /api/invoices/:id
exports.remove = async (req, res, next) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

// @route POST /api/invoices/:id/payment
exports.addPayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const payment = await Payment.create({
      date: req.body.date || new Date(),
      customer: invoice.customer,
      invoice: invoice._id,
      amount: req.body.amount,
      mode: req.body.mode,
      referenceNumber: req.body.referenceNumber,
      notes: req.body.notes,
      createdBy: req.user._id,
      organization: req.user.organization._id,
      plant: invoice.plant
    });

    invoice.paidAmount = (invoice.paidAmount || 0) + req.body.amount;
    invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
    invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partial';
    await invoice.save();

    res.status(201).json({ success: true, data: { payment, invoice } });
  } catch (error) { next(error); }
};

// @route GET /api/invoices/outstanding
exports.outstanding = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      organization: req.user.organization._id,
      status: { $in: ['issued', 'partial'] }
    })
    .populate('customer', 'name mobile')
    .sort({ date: 1 });
    
    const total = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    res.json({ success: true, data: invoices, totalOutstanding: total });
  } catch (error) { next(error); }
};
