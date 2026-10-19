const mongoose = require('mongoose');
const ProductionEntry = require('../models/ProductionEntry');
const Product = require('../models/Product');
const Material = require('../models/Material');
const StockMovement = require('../models/StockMovement');

// @route GET /api/production
exports.getAll = async (req, res, next) => {
  try {
    const { plant, from, to, page = 1, limit = 20 } = req.query;
    const query = { organization: req.user.organization._id };
    if (plant) query.plant = plant;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const entries = await ProductionEntry.find(query)
      .populate('product', 'name type unit')
      .populate('plant', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await ProductionEntry.countDocuments(query);
    res.json({ success: true, data: entries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// Materials consumed are always recorded in the material's own stock unit (the unit its
// stock is counted in), whatever unit the client sent. Blank rows are dropped.
const readMaterials = async (materials, organization) => {
  const rows = (materials || [])
    .map(m => ({ material: m?.material?._id || m?.material, quantity: Number(m?.quantity) }))
    .filter(m => m.material && m.quantity > 0);
  const units = await Material.unitMap(rows.map(r => r.material), organization);
  if (rows.some(r => !units.has(String(r.material)))) {
    const err = new Error('Selected material was not found');
    err.statusCode = 400;
    throw err;
  }
  return rows.map(r => ({ ...r, unit: units.get(String(r.material)) }));
};

// An entry made by plates gets its brick count from them; one made without plates drops them
const readPlates = (body) => {
  const plates = Number(body.plates);
  const perPlate = Number(body.bricksPerPlate);
  if (plates > 0 && perPlate > 0) return { plates, bricksPerPlate: perPlate, quantityProduced: plates * perPlate };
  return { plates: undefined, bricksPerPlate: undefined };
};

// @route POST /api/production
exports.create = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const materials = await readMaterials(req.body.materials, organization);
    const entry = await ProductionEntry.create({
      ...req.body,
      ...readPlates(req.body),
      materials,
      createdBy: req.user._id,
      organization
    });

    // Update material stock (deduct)
    for (const mat of materials) {
      await Material.findByIdAndUpdate(mat.material, { $inc: { currentStock: -mat.quantity } });
      await StockMovement.create({
        date: req.body.date,
        plant: req.body.plant,
        itemType: 'material',
        itemId: mat.material,
        qtyOut: mat.quantity,
        unit: mat.unit,
        refType: 'production',
        refId: entry._id,
        organization
      });
    }

    const populated = await entry.populate(['product', 'plant', 'materials.material']);
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @route GET /api/production/:id
exports.getOne = async (req, res, next) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id)
      .populate('product plant materials.material labourEntries.worker createdBy');
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: entry });
  } catch (error) { next(error); }
};

// @route PUT /api/production/:id
exports.update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if ('plates' in body) {
      const plates = readPlates(body);
      delete body.plates;
      delete body.bricksPerPlate;
      // Entered without plates this time: the old plate figures are removed from the entry
      if (plates.plates === undefined) body.$unset = { plates: 1, bricksPerPlate: 1 };
      else Object.assign(body, plates);
    }
    if (Array.isArray(body.materials)) {
      body.materials = await readMaterials(body.materials, req.user.organization._id);
    }
    const entry = await ProductionEntry.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: entry });
  } catch (error) { next(error); }
};

// @route DELETE /api/production/:id
exports.remove = async (req, res, next) => {
  try {
    await ProductionEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

// @route GET /api/production/summary
exports.summary = async (req, res, next) => {
  try {
    const { plant, from, to } = req.query;
    const match = { organization: req.user.organization._id };
    if (plant) match.plant = plant;
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }
    const agg = await ProductionEntry.aggregate([
      { $match: match },
      { $group: {
        _id: '$product',
        totalProduced: { $sum: '$quantityProduced' },
        totalDamaged: { $sum: '$quantityDamaged' },
        count: { $sum: 1 }
      }},
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' }
    ]);
    res.json({ success: true, data: agg });
  } catch (error) { next(error); }
};

// @route GET /api/production/cement-ratio?asOf=YYYY-MM-DD&exclude=<entry id>
// Bricks made per bag of cement, per brick type. Any material with "cement" in its name counts.
// The averages (last 30 days, last 365 days, lifetime) are total bricks / total bags over batches
// before `asOf`, so the day being checked never pulls its own average; `today` is the `asOf` day.
// `exclude` leaves one entry out (the one being edited).
exports.cementRatio = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const asOf = DATE_RE.test(req.query.asOf || '') ? req.query.asOf : new Date().toISOString().slice(0, 10);
    const daysBefore = (n) => {
      const d = new Date(asOf);
      d.setUTCDate(d.getUTCDate() - n);
      return d.toISOString().slice(0, 10);
    };
    const from30 = daysBefore(30);
    const from365 = daysBefore(365);

    const cement = await Material.find({ organization, name: /cement/i }).select('name unit').lean();
    if (cement.length === 0) return res.json({ success: true, data: { asOf, cement: [], products: [] } });

    const query = { organization, 'materials.material': { $in: cement.map(c => c._id) } };
    if (mongoose.isValidObjectId(req.query.exclude)) query._id = { $ne: req.query.exclude };
    const [entries, products] = await Promise.all([
      ProductionEntry.find(query).select('date product quantityProduced materials').lean(),
      Product.find({ organization }).select('name size').sort({ name: 1 }).lean(),
    ]);

    const isCement = new Set(cement.map(c => String(c._id)));
    const blank = () => ({ bricks: 0, bags: 0, entries: 0 });
    const byProduct = {};
    for (const e of entries) {
      const bags = e.materials.filter(m => isCement.has(String(m.material))).reduce((s, m) => s + (m.quantity || 0), 0);
      const day = new Date(e.date).toISOString().slice(0, 10);
      if (!(bags > 0) || !(e.quantityProduced > 0) || day > asOf) continue;
      const p = (byProduct[String(e.product)] ||= { today: blank(), last30: blank(), last365: blank(), lifetime: blank() });
      const add = (key) => { p[key].bricks += e.quantityProduced; p[key].bags += bags; p[key].entries += 1; };
      if (day === asOf) { add('today'); continue; }
      add('lifetime');
      if (day >= from365) add('last365');
      if (day >= from30) add('last30');
    }

    const withRatio = (t) => ({ ...t, bricksPerBag: t.bags > 0 ? t.bricks / t.bags : null });
    const data = products
      .filter(p => byProduct[String(p._id)])
      .map(p => {
        const t = byProduct[String(p._id)];
        return {
          product: p,
          today: withRatio(t.today), last30: withRatio(t.last30),
          last365: withRatio(t.last365), lifetime: withRatio(t.lifetime),
        };
      });
    res.json({ success: true, data: { asOf, cement, products: data } });
  } catch (error) { next(error); }
};
