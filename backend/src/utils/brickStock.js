const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductionEntry = require('../models/ProductionEntry');
const Invoice = require('../models/Invoice');

// Invoices in these states have not taken bricks out of stock
const NOT_SOLD = ['draft', 'cancelled'];

/**
 * Brick stock per brick type, worked out from the records:
 * opening stock + good bricks produced (produced - damaged) - bricks sold on invoices.
 * - plant: only that plant's production and sales; opening stock is not kept per plant,
 *   so it is counted only when no plant is given
 * - excludeInvoice: leave this invoice's sales out (used when checking an edit to it)
 * Returns one row per brick type, sorted by name.
 */
async function getBrickStock(organization, { plant, excludeInvoice } = {}) {
  const plantMatch = plant && mongoose.isValidObjectId(plant) ? { plant: new mongoose.Types.ObjectId(String(plant)) } : {};
  const invoiceMatch = { organization, status: { $nin: NOT_SOLD }, ...plantMatch };
  if (excludeInvoice) invoiceMatch._id = { $ne: new mongoose.Types.ObjectId(String(excludeInvoice)) };

  const [products, produced, sold] = await Promise.all([
    Product.find({ organization }).sort({ name: 1 }).lean(),
    ProductionEntry.aggregate([
      { $match: { organization, ...plantMatch } },
      { $group: {
        _id: '$product',
        produced: { $sum: '$quantityProduced' },
        damaged: { $sum: { $ifNull: ['$quantityDamaged', 0] } },
        lastDate: { $max: '$date' },
      } },
    ]),
    Invoice.aggregate([
      { $match: invoiceMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', sold: { $sum: '$items.quantity' }, lastDate: { $max: '$date' } } },
    ]),
  ]);

  const producedById = Object.fromEntries(produced.map(r => [String(r._id), r]));
  const soldById = Object.fromEntries(sold.map(r => [String(r._id), r]));
  return products.map(p => {
    const made = producedById[String(p._id)] || {};
    const out = soldById[String(p._id)] || {};
    const openingStock = plantMatch.plant ? 0 : (p.openingStock || 0);
    const good = (made.produced || 0) - (made.damaged || 0);
    return {
      product: { _id: p._id, name: p.name, size: p.size, unit: p.unit, isActive: p.isActive },
      openingStock,
      produced: made.produced || 0,
      damaged: made.damaged || 0,
      good,
      sold: out.sold || 0,
      available: openingStock + good - (out.sold || 0),
      lastProduced: made.lastDate || null,
      lastSold: out.lastDate || null,
    };
  });
}

/**
 * Checks that there are enough bricks for an invoice's items, across all plants.
 * Returns an error message, or null when every brick type has enough stock.
 */
async function checkBrickStock(organization, items, { excludeInvoice } = {}) {
  const wanted = {};
  for (const item of items || []) {
    if (!item.product) continue;
    const id = String(item.product._id || item.product);
    wanted[id] = (wanted[id] || 0) + (Number(item.quantity) || 0);
  }
  if (Object.keys(wanted).length === 0) return null;

  const stock = await getBrickStock(organization, { excludeInvoice });
  const byId = Object.fromEntries(stock.map(r => [String(r.product._id), r]));
  const short = Object.entries(wanted)
    .filter(([id, qty]) => qty > Math.max(byId[id]?.available || 0, 0))
    .map(([id, qty]) => {
      const row = byId[id];
      const available = Math.max(row?.available || 0, 0);
      return `${row?.product.name || 'Brick'}: only ${available.toLocaleString('en-IN')} pcs available, invoice has ${qty.toLocaleString('en-IN')}`;
    });
  return short.length ? `Not enough bricks in stock. ${short.join('; ')}` : null;
}

/**
 * Ledger for one brick type, oldest first: opening stock, then good bricks in from each
 * production entry and bricks out on each sale, with the balance after each.
 * - plant: only that plant's production and sales (opening stock is then left out)
 * - from / to (YYYY-MM-DD): limit the rows; the opening balance is then the stock just before `from`
 * Returns null when the brick type is not found.
 */
async function getBrickLedger(organization, productId, { plant, from, to } = {}) {
  if (!mongoose.isValidObjectId(productId)) return null;
  const product = await Product.findOne({ _id: productId, organization }).lean();
  if (!product) return null;
  const plantMatch = plant && mongoose.isValidObjectId(plant) ? { plant: new mongoose.Types.ObjectId(String(plant)) } : {};

  const [production, invoices] = await Promise.all([
    ProductionEntry.find({ organization, product: product._id, ...plantMatch }).populate('plant', 'name').lean(),
    Invoice.find({ organization, status: { $nin: NOT_SOLD }, 'items.product': product._id, ...plantMatch })
      .populate('plant', 'name').populate('customer', 'name').lean(),
  ]);

  const pcs = (n) => `${(n || 0).toLocaleString('en-IN')} pcs`;
  const rows = [
    ...production.map(p => {
      const damaged = p.quantityDamaged || 0;
      return {
        type: 'production', refId: p._id, date: p.date, createdAt: p.createdAt, plant: p.plant?.name || '',
        party: 'Produced',
        detail: [`${pcs(p.quantityProduced)} made`, damaged ? `${pcs(damaged)} damaged` : '', (p.shift || '').replace('_', ' ')].filter(Boolean).join(' · '),
        produced: p.quantityProduced || 0, damaged,
        qtyIn: (p.quantityProduced || 0) - damaged, qtyOut: 0,
      };
    }),
    ...invoices.map(i => {
      const lines = (i.items || []).filter(it => String(it.product) === String(product._id));
      const qty = lines.reduce((s, it) => s + (it.quantity || 0), 0);
      const rate = lines[0]?.rate;
      return {
        type: 'sale', refId: i._id, date: i.date, createdAt: i.createdAt, plant: i.plant?.name || '',
        party: i.customer?.name || 'Sale',
        detail: [`Invoice ${i.invoiceNumber}`, rate != null ? `₹${rate.toLocaleString('en-IN')} per pc` : '', i.vehicleNumber ? `Vehicle ${i.vehicleNumber}` : ''].filter(Boolean).join(' · '),
        qtyIn: 0, qtyOut: qty,
      };
    }),
  ].sort((a, b) => (new Date(a.date) - new Date(b.date)) || (new Date(a.createdAt) - new Date(b.createdAt)));

  const start = plantMatch.plant ? 0 : (product.openingStock || 0);
  let balance = start;
  const all = rows.map(r => ({ ...r, balance: (balance += r.qtyIn - r.qtyOut) }));

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const fromDay = DATE_RE.test(from || '') ? from : null;
  const toDay = DATE_RE.test(to || '') ? to : null;
  const dayOf = (r) => new Date(r.date).toISOString().slice(0, 10);
  const before = fromDay ? all.filter(r => dayOf(r) < fromDay) : [];
  const entries = all.filter(r => (!fromDay || dayOf(r) >= fromDay) && (!toDay || dayOf(r) <= toDay));
  const sum = (list, key) => list.reduce((s, r) => s + (r[key] || 0), 0);
  const opening = start + sum(before, 'qtyIn') - sum(before, 'qtyOut');
  const totalIn = sum(entries, 'qtyIn');
  const totalOut = sum(entries, 'qtyOut');

  return {
    product: { _id: product._id, name: product.name, size: product.size, openingStock: product.openingStock || 0 },
    from: fromDay, to: toDay,
    opening, totalIn, totalOut, closing: opening + totalIn - totalOut,
    produced: sum(entries, 'produced'), damaged: sum(entries, 'damaged'),
    currentStock: balance,
    entries,
  };
}

module.exports = { getBrickStock, checkBrickStock, getBrickLedger, NOT_SOLD };
