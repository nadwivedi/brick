import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hammer, ShoppingBag, TriangleAlert, Layers, Plus, PackageCheck } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import StatCard from './StatCard';
import { LoadingState, EmptyState } from './States';

const num = (n) => (n || 0).toLocaleString('en-IN');

/** Bricks produced, sold and still in stock, for each brick type. */
export default function BrickStock() {
  const [rows, setRows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [plant, setPlant] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plants').then(res => setPlants(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/stock/bricks', { params: plant ? { plant } : {} })
      .then(res => setRows(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [plant]);

  // Inactive brick types are shown only while they still have some history
  const shown = rows.filter(r => r.product.isActive !== false || r.produced || r.sold);
  const totals = shown.reduce((t, r) => ({
    produced: t.produced + r.produced, damaged: t.damaged + r.damaged,
    sold: t.sold + r.sold, available: t.available + r.available,
  }), { produced: 0, damaged: 0, sold: 0, available: 0 });

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Hammer} label="Produced" hint="All bricks made" value={`${num(totals.produced)} pcs`} tone="blue" />
        <StatCard icon={TriangleAlert} label="Damaged" hint="Broken in production" value={`${num(totals.damaged)} pcs`} tone="amber" />
        <StatCard icon={ShoppingBag} label="Sold" hint="On sale invoices" value={`${num(totals.sold)} pcs`} tone="indigo" />
        <StatCard icon={PackageCheck} label="Available" hint="Good bricks left to sell" value={`${num(totals.available)} pcs`} tone={totals.available < 0 ? 'rose' : 'emerald'} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">Stock by Brick Type</h3>
              <p className="text-xs text-slate-500">Available = opening stock + good bricks produced − bricks sold{plant ? ' (opening stock is counted under All plants)' : ''}</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              {hasManyPlants(plants) && (
                <select className="input flex-1 md:w-48 md:flex-none" value={plant} onChange={e => setPlant(e.target.value)} aria-label="Plant">
                  <option value="">All plants</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              )}
              <Link className="btn-secondary flex-shrink-0" to="/masters/brick-types">
                <Plus size={16} /> Add Brick Type
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading brick stock…" />
        ) : shown.length === 0 ? (
          <EmptyState icon={Layers} title="No brick types yet" hint="Add your brick types (e.g. 8 inch, 9 inch) in Masters → Brick Types" />
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:gap-4 md:p-5 xl:grid-cols-3">
            {shown.map(r => {
              const short = r.available < 0;
              const inHand = r.openingStock + r.good;
              const soldPct = inHand > 0 ? Math.min(100, Math.max(0, (r.sold / inHand) * 100)) : 0;
              return (
                <div key={r.product._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{r.product.name}</p>
                      <p className="truncate text-xs text-slate-500">{r.product.size || 'No size set'}</p>
                    </div>
                    {r.product.isActive === false && <span className="badge-gray">Inactive</span>}
                  </div>

                  <div className="mt-3">
                    <p className={`text-3xl font-bold leading-tight ${short ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {num(r.available)} <span className="text-base font-semibold">pcs</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500">{short ? 'More sold than produced' : 'Available to sell'}</p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-500" title={`${soldPct.toFixed(0)}% of bricks sold`}>
                    <div className="h-full bg-indigo-500" style={{ width: `${soldPct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Sold</span><span>Left</span>
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Opening</dt>
                      <dd className="font-bold text-slate-800">{num(r.openingStock)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Produced</dt>
                      <dd className="font-bold text-slate-800">{num(r.produced)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Damaged</dt>
                      <dd className="font-bold text-amber-600">{num(r.damaged)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sold</dt>
                      <dd className="font-bold text-indigo-600">{num(r.sold)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-[11px] text-slate-400">
                    {r.lastProduced ? `Last made ${dayjs(r.lastProduced).format('D MMM YYYY')}` : 'Not produced yet'}
                    {' · '}
                    {r.lastSold ? `last sold ${dayjs(r.lastSold).format('D MMM YYYY')}` : 'not sold yet'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
