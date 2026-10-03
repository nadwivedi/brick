const ProductionEntry = require('../models/ProductionEntry');
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

// @route POST /api/production
exports.create = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const materials = await readMaterials(req.body.materials, organization);
    const entry = await ProductionEntry.create({
      ...req.body,
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
