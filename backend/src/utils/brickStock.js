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

module.exports = { getBrickStock, checkBrickStock, NOT_SOLD };
