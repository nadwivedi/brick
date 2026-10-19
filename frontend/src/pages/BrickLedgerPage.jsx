import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Hammer, FileText, BookOpen, ChevronLeft, Package, ArrowUpFromLine, PackageCheck } from 'lucide-react';
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
  production: { icon: Hammer, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100', label: 'Produced' },
  sale: { icon: FileText, tile: 'bg-indigo-50 text-indigo-700 ring-indigo-100', label: 'Sold to' },
};

// Stock can only go below zero for sales made before stock was checked; show that in red
const balanceClass = (n) => (n < 0 ? 'text-rose-600' : 'text-slate-800');

/** Ledger for one brick type: when bricks were produced, when they were sold, and the stock after each. */
export default function BrickLedgerPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const plant = searchParams.get('plant') || '';
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState(null); // null = all time, else { from, to }
  const [custom, setCustom] = useState({ from: dayjs().startOf('month').format(DATE_FMT), to: dayjs().format(DATE_FMT) });

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data || [])).catch(console.error);
    api.get('/plants').then(res => setPlants(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/stock/bricks/${productId}/ledger`, { params: { ...(range || {}), ...(plant && { plant }) } })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [productId, range, plant]);

  const selectRange = (key) => {
    setRangeKey(key);
    const preset = RANGES.find(r => r.key === key);
    if (!preset.get) return; // custom: wait for Apply
    const dates = preset.get();
    setRange(dates ? { from: dates[0].format(DATE_FMT), to: dates[1].format(DATE_FMT) } : null);
  };

  const keepPlant = plant ? `?plant=${plant}` : '';
  const customValid = custom.from && custom.to && custom.from <= custom.to;
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
            <h1 className="page-title">Brick Ledger{ledger ? ` — ${ledger.product.name}` : ''}</h1>
            <p className="page-subtitle">
              {ledger?.product.size ? `${ledger.product.size} · ` : ''}Every production and sale, with the stock after each · {periodText}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0">
          {hasManyPlants(plants) && (
            <select className="input min-w-0 flex-1 md:w-44 md:flex-none" value={plant} aria-label="Plant"
              onChange={e => setSearchParams(e.target.value ? { plant: e.target.value } : {}, { replace: true })}>
              <option value="">All plants</option>
              {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          )}
          <select className="input min-w-0 flex-1 md:w-56 md:flex-none" value={productId} aria-label="Brick type"
            onChange={e => navigate(`/inventory/bricks/${e.target.value}${keepPlant}`)}>
            {!products.some(p => p._id === productId) && <option value={productId}>Select Brick Type</option>}
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
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
            <StatCard icon={Package} label="Opening" hint={range ? `Stock before ${dayjs(range.from).format('D MMM')}` : plant ? 'Opening stock is counted under All plants' : 'Opening stock of this brick type'} value={`${num(ledger.opening)} pcs`} tone="slate" />
            <StatCard icon={Hammer} label="Produced (good)" hint={ledger.damaged ? `${num(ledger.produced)} made, ${num(ledger.damaged)} damaged` : `${num(ledger.produced)} made`} value={`+ ${num(ledger.totalIn)} pcs`} tone="emerald" />
            <StatCard icon={ArrowUpFromLine} label="Sold" hint="On sale invoices" value={`− ${num(ledger.totalOut)} pcs`} tone="indigo" />
            <StatCard icon={PackageCheck} label="Closing" hint={`Available now: ${num(ledger.currentStock)} pcs`} value={`${num(ledger.closing)} pcs`} tone={ledger.closing < 0 ? 'rose' : 'blue'} />
          </section>

          <section className="panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Details</th>
                    <th className="table-header text-right">In (produced)</th>
                    <th className="table-header text-right">Out (sold)</th>
                    <th className="table-header text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.to).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell font-bold text-slate-900">Closing balance</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-emerald-700">{ledger.totalIn ? `+ ${num(ledger.totalIn)}` : ''}</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-indigo-600">{ledger.totalOut ? `− ${num(ledger.totalOut)}` : ''}</td>
                    <td className={`table-cell whitespace-nowrap text-right font-bold ${ledger.closing < 0 ? 'text-rose-600' : 'text-primary-700'}`}>{num(ledger.closing)} pcs</td>
                  </tr>
                  {/* Newest first: the latest production or sale is on top, the oldest at the bottom */}
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
                                {e.type === 'sale' ? <>{t.label} <span className="font-medium text-slate-400">·</span> {e.party}</> : t.label}
                              </p>
                              <p className="text-xs text-slate-500">{[hasManyPlants(plants) && e.plant, e.detail].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-emerald-700">{e.qtyIn ? `+ ${num(e.qtyIn)}` : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-indigo-600">{e.qtyOut ? `− ${num(e.qtyOut)}` : ''}</td>
                        <td className={`table-cell whitespace-nowrap text-right font-bold ${balanceClass(e.balance)}`}>{num(e.balance)} pcs</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/60">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.from).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">Opening balance</p>
                      <p className="text-xs text-slate-500">{range ? 'Stock carried forward from before this period' : 'Opening stock set on the brick type'}</p>
                    </td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{num(ledger.opening)} pcs</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="table-footer">
              {ledger.entries.length === 0
                ? 'No production or sales of this brick type in this period.'
                : `${ledger.entries.length} ${ledger.entries.length === 1 ? 'entry' : 'entries'} in this period`}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
