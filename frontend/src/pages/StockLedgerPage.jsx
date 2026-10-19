import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import StockAdjustModal from '../components/StockAdjustModal';
import { ShoppingCart, Hammer, BookOpen, ChevronLeft, Package, ArrowDownToLine, ArrowUpFromLine, Boxes, SlidersHorizontal } from 'lucide-react';
import dayjs from 'dayjs';

const num = (n) => (n || 0).toLocaleString('en-IN');

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'all', label: 'All Time', get: () => null },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'month', label: 'This Month', get: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

const TYPES = {
  purchase: { label: 'Purchased', icon: ShoppingCart, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  production: { label: 'Used in production', icon: Hammer, tile: 'bg-rose-50 text-rose-700 ring-rose-100' },
  adjustment: { label: 'Stock adjusted', icon: SlidersHorizontal, tile: 'bg-amber-50 text-amber-700 ring-amber-100' },
};

/** Stock ledger for one material: when it was purchased, when it was used, and the balance after each. */
export default function StockLedgerPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState(null); // null = all time, else { from, to }
  const [custom, setCustom] = useState({ from: dayjs().startOf('month').format(DATE_FMT), to: dayjs().format(DATE_FMT) });
  const [adjusting, setAdjusting] = useState(false);
  const [reload, setReload] = useState(0); // bumped after an adjustment to refetch

  useEffect(() => {
    api.get('/stock/summary').then(res => setMaterials(res.data || [])).catch(console.error);
  }, [reload]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/stock/ledger/${materialId}`, { params: range || {} })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [materialId, range, reload]);

  const selectRange = (key) => {
    setRangeKey(key);
    const preset = RANGES.find(r => r.key === key);
    if (!preset.get) return; // custom: wait for Apply
    const dates = preset.get();
    setRange(dates ? { from: dates[0].format(DATE_FMT), to: dates[1].format(DATE_FMT) } : null);
  };

  const customValid = custom.from && custom.to && custom.from <= custom.to;
  const unit = ledger?.material.unit || '';
  const periodText = !range
    ? 'All time'
    : range.from === range.to
      ? dayjs(range.from).format('D MMM YYYY')
      : `${dayjs(range.from).format('D MMM YYYY')} – ${dayjs(range.to).format('D MMM YYYY')}`;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="icon-btn hidden bg-white ring-1 ring-slate-200 lg:block" title="Back to Inventory" aria-label="Back to Inventory">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Stock Ledger{ledger ? ` — ${ledger.material.name}` : ''}</h1>
            <p className="page-subtitle">Purchases, production use and adjustments, with the balance after each · {periodText}</p>
          </div>
        </div>
        <div className="flex gap-2 md:shrink-0">
          <select className="input min-w-0 flex-1 md:w-56 md:flex-none" value={materialId} onChange={e => navigate(`/inventory/ledger/${e.target.value}`)} aria-label="Material">
            {!materials.some(m => m._id === materialId) && <option value={materialId}>Select Material</option>}
            {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>)}
          </select>
          <button className="btn-primary flex-shrink-0" onClick={() => setAdjusting(true)} disabled={materials.length === 0}>
            <SlidersHorizontal size={16} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-3">
        <Segmented options={RANGES} value={rangeKey} onChange={selectRange} />
        {rangeKey === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={custom.from} max={custom.to || undefined}
                onChange={e => setCustom({ ...custom, from: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={custom.to} min={custom.from || undefined}
                onChange={e => setCustom({ ...custom, to: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={() => customValid && setRange({ ...custom })} disabled={!customValid}>Apply</button>
            {!customValid && <p className="pb-2 text-xs font-medium text-rose-600">"From" date must be on or before "To" date</p>}
          </div>
        )}
      </div>

      {error ? (
        <section className="panel"><EmptyState icon={BookOpen} title="Could not load the ledger" hint={error} /></section>
      ) : !ledger ? (
        <LoadingState label="Loading ledger…" />
      ) : (
        <div className={`space-y-4 transition-opacity md:space-y-5 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
          <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
            <StatCard icon={Package} label="Opening" hint={range ? `Stock before ${dayjs(range.from).format('D MMM')}` : 'Before the first entry'} value={`${num(ledger.opening)} ${unit}`} tone="slate" />
            <StatCard icon={ArrowDownToLine} label="Stock In" hint="Purchases and increases" value={`+ ${num(ledger.totalIn)} ${unit}`} tone="emerald" />
            <StatCard icon={ArrowUpFromLine} label="Stock Out" hint="Usage and decreases" value={`− ${num(ledger.totalOut)} ${unit}`} tone="rose" />
            <StatCard icon={Boxes} label="Closing" hint={`In stock now: ${num(ledger.currentStock)} ${unit}`} value={`${num(ledger.closing)} ${unit}`} tone="blue" />
          </section>

          <section className="panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Details</th>
                    <th className="table-header text-right">In</th>
                    <th className="table-header text-right">Out</th>
                    <th className="table-header text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Newest first: the latest purchase or use is on top, the oldest at the bottom */}
                  {[...ledger.entries].reverse().map((e, i) => {
                    const t = TYPES[e.type];
                    const Icon = t.icon;
                    return (
                      <tr key={`${e.type}-${e.refId}-${i}`} className="table-row">
                        <td className="table-cell whitespace-nowrap font-semibold text-slate-800">{dayjs(e.date).format('DD MMM YYYY')}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${t.tile}`}>
                              <Icon size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {e.type === 'adjustment' ? (e.qtyIn ? 'Stock increased' : 'Stock decreased') : t.label}{' '}
                                <span className="font-medium text-slate-400">·</span> {e.party}
                                {e.type === 'adjustment' && <span className="badge-orange ml-2">Adjustment</span>}
                              </p>
                              <p className="text-xs text-slate-500">{[e.plant, e.detail].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-emerald-700">{e.qtyIn ? `+ ${num(e.qtyIn)}` : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-rose-600">{e.qtyOut ? `− ${num(e.qtyOut)}` : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{num(e.balance)} {unit}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/60">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.from).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">Opening balance</p>
                      <p className="text-xs text-slate-500">{range ? 'Stock carried forward from before this period' : 'Opening stock and manual changes before these entries'}</p>
                    </td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{num(ledger.opening)} {unit}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="table-footer">
              {ledger.entries.length === 0
                ? 'No purchases or production use recorded in this period.'
                : `${ledger.entries.length} ${ledger.entries.length === 1 ? 'entry' : 'entries'} in this period`}
            </p>
          </section>
        </div>
      )}

      {adjusting && (
        <StockAdjustModal
          materials={materials}
          materialId={materialId}
          onClose={() => setAdjusting(false)}
          onSaved={() => setReload(n => n + 1)}
        />
      )}
    </div>
  );
}
