import { Gauge } from 'lucide-react';
import { EmptyState } from './States';
import {
  CEMENT_TOLERANCE, CEMENT_STATUS, cementDiff, cementStatus, fmtRatio, diffText, baselineOf,
} from '../lib/cement';

const PERIODS = [
  { key: 'last30', label: 'Last 30 days avg' },
  { key: 'last365', label: 'Last 1 year avg' },
  { key: 'lifetime', label: 'Lifetime avg' },
];

/** One average line: the average ratio, and how a batch compares with it. */
function AverageRow({ label, avg, ratio }) {
  const diff = cementDiff(ratio, avg?.bricksPerBag);
  const status = CEMENT_STATUS[cementStatus(diff)];
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-[11px] text-slate-400">
          {avg?.bricksPerBag ? `${fmtRatio(avg.bricksPerBag)} bricks/bag · ${avg.entries} batch${avg.entries === 1 ? '' : 'es'}` : 'No earlier batches'}
        </p>
      </div>
      {status && <span className={`${status.badge} whitespace-nowrap`}>{diff != null && Math.abs(diff) >= 0.5 ? diffText(diff) : 'Same'}</span>}
    </div>
  );
}

/** Live check for the batch being entered in the production form. */
export function CementCheck({ bricks, bags, unit = 'bag', row }) {
  const ratio = bags > 0 && bricks > 0 ? bricks / bags : null;
  if (!ratio) return null;
  const base = baselineOf(row);
  const status = CEMENT_STATUS[cementStatus(cementDiff(ratio, base?.bricksPerBag))];
  return (
    <div className={`mt-3 rounded-lg border p-3 ${status?.box || 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">
          Cement ratio: 1 {unit.toLowerCase()} → {fmtRatio(ratio)} bricks
        </p>
        {status && <span className={status.badge}>{status.label}</span>}
      </div>
      {status && status !== CEMENT_STATUS.normal && <p className={`mt-0.5 text-xs font-semibold ${status.text}`}>{status.hint}</p>}
      {!base?.bricksPerBag && <p className="mt-0.5 text-xs text-slate-500">No earlier batches of this brick type to compare with yet.</p>}
      <div className="mt-2 divide-y divide-slate-200/70">
        {PERIODS.map(p => <AverageRow key={p.key} label={p.label} avg={row?.[p.key]} ratio={ratio} />)}
      </div>
    </div>
  );
}

/** Today's cement use per brick type against the 30-day, 1-year and lifetime averages. */
export default function CementRatioPanel({ data }) {
  const products = data?.products || [];
  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Gauge size={16} /> Cement Ratio</h3>
        <p className="text-xs text-slate-500">
          Bricks made per bag of cement. More than {CEMENT_TOLERANCE}% extra cement may mean leakage or theft; {CEMENT_TOLERANCE}% less may mean weak bricks.
        </p>
      </div>
      {!data ? null : data.cement.length === 0 ? (
        <EmptyState icon={Gauge} title="No cement material yet" hint='Add a raw material named "Cement" and record it in production entries.' />
      ) : products.length === 0 ? (
        <EmptyState icon={Gauge} title="No cement recorded yet" hint="Add cement under Materials Consumed when you enter production." />
      ) : (
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:gap-4 md:p-5 xl:grid-cols-3">
          {products.map(r => {
            const ratio = r.today.bricksPerBag;
            const base = baselineOf(r);
            const status = CEMENT_STATUS[cementStatus(cementDiff(ratio, base?.bricksPerBag))];
            return (
              <div key={r.product._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{r.product.name}</p>
                    <p className="truncate text-xs text-slate-500">{r.product.size || 'Today'}</p>
                  </div>
                  {status && <span className={status.badge}>{status.label}</span>}
                </div>
                <div className="mt-3">
                  {ratio ? (
                    <>
                      <p className={`text-3xl font-bold leading-tight ${status?.text || 'text-slate-900'}`}>
                        {fmtRatio(ratio)} <span className="text-base font-semibold">bricks/bag</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Today: {r.today.bricks.toLocaleString('en-IN')} bricks from {r.today.bags.toLocaleString('en-IN')} bags
                        {status && status !== CEMENT_STATUS.normal ? ` · ${status.hint}` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold leading-tight text-slate-300">—</p>
                      <p className="text-xs font-semibold text-slate-500">No cement entered today</p>
                    </>
                  )}
                </div>
                <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-1">
                  {PERIODS.map(p => <AverageRow key={p.key} label={p.label} avg={r[p.key]} ratio={ratio} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
