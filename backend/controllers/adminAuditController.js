const AdminActivityLog = require('../models/AdminActivityLog');

const MAX_ITEMS = 2000;

// 'YYYY-MM-DD' in India time -> Date
const istDate = (iso, endOfDay) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null;
  const date = new Date(`${iso}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// @route GET /api/admin/audit/activity?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getAdminActivity = async (req, res, next) => {
  try {
    const from = istDate(req.query.from, false);
    const to = istDate(req.query.to, true);
    if (!from || !to || from > to) {
      return res.status(400).json({ success: false, message: 'Please choose a valid date range' });
    }

    const match = { createdAt: { $gte: from, $lte: to } };
    const [items, byAction, total] = await Promise.all([
      AdminActivityLog.find(match).sort({ createdAt: -1 }).limit(MAX_ITEMS).lean(),
      AdminActivityLog.aggregate([{ $match: match }, { $group: { _id: '$action', count: { $sum: 1 } } }]),
      AdminActivityLog.countDocuments(match),
    ]);

    const totals = { total };
    for (const row of byAction) totals[row._id] = row.count;

    res.json({ success: true, data: { items, totals, truncated: total > items.length } });
  } catch (error) {
    next(error);
  }
};
