// Cement use per batch is measured as bricks made per bag of cement (higher = less cement).

// How far (in %) a batch can be from the average before it is flagged
export const CEMENT_TOLERANCE = 10;

// Any raw material with "cement" in its name counts as cement
export const isCement = (name = '') => /cement/i.test(name);

export const bricksPerBag = (bricks, bags) => (bags > 0 && bricks > 0 ? bricks / bags : null);

/** How much more (+) or less (-) cement a batch used than an average, in %. */
export const cementDiff = (ratio, avgRatio) => (ratio && avgRatio ? (avgRatio / ratio - 1) * 100 : null);

export const cementStatus = (diff) => {
  if (diff == null) return null;
  if (diff > CEMENT_TOLERANCE) return 'high';
  if (diff < -CEMENT_TOLERANCE) return 'low';
  return 'normal';
};

export const CEMENT_STATUS = {
  high: { label: 'More cement', hint: 'Possible leakage or theft', badge: 'badge-red', text: 'text-rose-600', box: 'border-rose-200 bg-rose-50' },
  low: { label: 'Less cement', hint: 'Possible brick quality issue', badge: 'badge-orange', text: 'text-amber-700', box: 'border-amber-200 bg-amber-50' },
  normal: { label: 'Normal', hint: 'Within the usual range', badge: 'badge-green', text: 'text-emerald-700', box: 'border-emerald-200 bg-emerald-50' },
};

export const fmtRatio = (r) => (r ? Math.round(r).toLocaleString('en-IN') : '—');

export const diffText = (diff) => (diff == null ? '' : `${Math.abs(diff).toFixed(0)}% ${diff >= 0 ? 'more' : 'less'} cement`);

// The average a batch is judged against: last year, or lifetime if there is no data for the year
export const baselineOf = (row) => (row?.last365?.bricksPerBag ? row.last365 : row?.lifetime);
