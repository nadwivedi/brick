const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { checkBrickStock, NOT_SOLD } = require('../utils/brickStock');
const { pickAccount, modeFor } = require('../utils/accounts');
const { resolveSaleTransport, resolveSaleVehicle } = require('../utils/transport');
require('../models/Vehicle');

// The sale's transport and vehicle, cleaned up; the total follows the transport charge kept
const withTransport = async (organization, body) => {
  const transport = await resolveSaleTransport(organization, body);
  const vehicle = await resolveSaleVehicle(organization, body, transport);
  const totalAmount = Number(body.totalAmount || 0) - (Number(body.transportCharges) || 0) + transport.transportCharges;
  return { ...body, ...transport, ...vehicle, totalAmount };
};

// The payment taken when the sale was made. Sales saved before payments were tagged `atSale`
// have theirs created alongside the invoice, so it is the linked one made within a minute of it.
const atSalePayment = async (invoice) => {
  const tagged = await Payment.findOne({ organization: invoice.organization, invoice: invoice._id, atSale: true });
  if (tagged) return tagged;
  const madeAt = new Date(invoice.createdAt);
  return Payment.findOne({
    organization: invoice.organization, invoice: invoice._id,
    createdAt: { $gte: madeAt, $lte: new Date(madeAt.getTime() + 60 * 1000) },
  }).sort({ createdAt: 1 });
};

// Fields the sale form may change
const EDITABLE = ['date', 'customer', 'plant', 'items', 'subtotal', 'gstTotal', 'transportCharges', 'discount', 'totalAmount', 'paidAmount',
  'transportMode', 'vehicle', 'transporter', 'transportBasis', 'transportQty', 'transportRate', 'transportCost', 'transportLocation',
  'vehicleNumber', 'driverName', 'siteAddress', 'notes', 'status'];
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));

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
      .populate('transporter', 'name mobile')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Invoice.countDocuments(query);
    res.json({ success: true, data: invoices, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// Next invoice number for an organization: one more than the highest used so far.
// (Counting invoices would hand out a number that is still taken once an invoice is deleted.)
const nextInvoiceNumber = async (organization) => {
  const used = await Invoice.find({ organization, invoiceNumber: /^INV-\d+$/ }).select('invoiceNumber').lean();
  const highest = used.reduce((max, i) => Math.max(max, Number(i.invoiceNumber.slice(4))), 0);
  return `INV-${String(highest + 1).padStart(4, '0')}`;
};

// @route POST /api/invoices
exports.create = async (req, res, next) => {
  try {
    const body = await withTransport(req.user.organization._id, req.body);
    // Bricks can't be sold beyond what is in stock
    if (!NOT_SOLD.includes(body.status)) {
      const shortage = await checkBrickStock(req.user.organization._id, body.items);
      if (shortage) return res.status(400).json({ success: false, message: shortage });
    }

    // Two invoices saved at the same moment can pick the same number; the second one retries
    let invoice;
    for (let attempt = 1; !invoice; attempt++) {
      try {
        invoice = await Invoice.create({
          ...body,
          invoiceNumber: await nextInvoiceNumber(req.user.organization._id),
          balanceDue: body.totalAmount - (body.paidAmount || 0),
          createdBy: req.user._id,
          organization: req.user.organization._id
        });
      } catch (e) {
        if (e.code !== 11000 || attempt >= 3) throw e;
      }
    }

    // Money received with the sale goes into the chosen cash / bank account
    if (invoice.paidAmount > 0) {
      const account = await pickAccount(req.user.organization._id, req.body.account);
      await Payment.create({
        date: invoice.date,
        customer: invoice.customer,
        invoice: invoice._id,
        atSale: true,
        amount: invoice.paidAmount,
        account: account._id,
        mode: modeFor(account, req.body.paymentMode),
        createdBy: req.user._id,
        organization: req.user.organization._id,
        plant: invoice.plant
      });
    }

    const populated = await invoice.populate(['customer', 'plant', 'items.product', 'transporter']);
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @route GET /api/invoices/:id
exports.getOne = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organization: req.user.organization._id })
      .populate('customer plant items.product createdBy');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    // What was received with the sale, and into which account, for the edit form
    const payment = await atSalePayment(invoice);
    res.json({
      success: true,
      data: { ...invoice.toObject(), atSale: payment ? { amount: payment.amount, account: payment.account, mode: payment.mode } : null },
    });
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

    const fields = pick(req.body, EDITABLE);
    const body = 'transportMode' in fields ? await withTransport(organization, fields) : fields;
    if ('paidAmount' in body) body.paidAmount = Math.max(Number(body.paidAmount) || 0, 0);
    const total = body.totalAmount ?? existing.totalAmount;
    body.balanceDue = total - (body.paidAmount ?? existing.paidAmount ?? 0);
    const invoice = await Invoice.findByIdAndUpdate(existing._id, body, { new: true, runValidators: true });

    // Keep the money received with the sale in step with the edit
    if ('paidAmount' in body) {
      const payment = await atSalePayment(existing);
      if (invoice.paidAmount > 0) {
        const account = await pickAccount(organization, req.body.account || payment?.account);
        const entry = {
          date: invoice.date, customer: invoice.customer, plant: invoice.plant, amount: invoice.paidAmount,
          account: account._id, mode: modeFor(account, req.body.paymentMode || payment?.mode), atSale: true,
        };
        if (payment) await Payment.updateOne({ _id: payment._id }, entry);
        else await Payment.create({ ...entry, invoice: invoice._id, createdBy: req.user._id, organization });
      } else if (payment) {
        await Payment.deleteOne({ _id: payment._id });
      }
    }
    // Receipts made later stay with the party they were received from
    if (String(existing.customer) !== String(invoice.customer)) {
      await Payment.updateMany({ organization, invoice: invoice._id, atSale: { $ne: true } }, { $unset: { invoice: 1 } });
    }

    const populated = await invoice.populate(['customer', 'plant', 'items.product', 'transporter']);
    res.json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @route DELETE /api/invoices/:id
exports.remove = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, organization });
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    // The money taken with the sale goes with it; any other receipt for it stays with the party
    await Payment.deleteMany({ organization, invoice: invoice._id, atSale: true });
    await Payment.updateMany({ organization, invoice: invoice._id }, { $unset: { invoice: 1 } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};
