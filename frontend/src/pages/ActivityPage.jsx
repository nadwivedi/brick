import { useEffect, useState } from 'react';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import StatCard from '../components/StatCard';
import Segmented from '../components/Segmented';
import SearchInput from '../components/SearchInput';
import { LoadingState, EmptyState } from '../components/States';
import { Hammer, ShoppingCart, FileText, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtNum = (n) => (n || 0).toLocaleString('en-IN');

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'today', label: 'Today', get: () => [dayjs(), dayjs()] },
  { key: 'yesterday', label: 'Yesterday', get: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

// How each kind of operation is shown in the list
const TYPES = {
  production: { label: 'Production', icon: Hammer, tile: 'bg-blue-50 text-blue-700 ring-blue-100', value: 'text-blue-700' },
  purchase: { label: 'Purchase', icon: ShoppingCart, tile: 'bg-indigo-50 text-indigo-700 ring-indigo-100', value: 'text-rose-600' },
  sale: { label: 'Sale', icon: FileText, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100', value: 'text-slate-800' },
  payment: { label: 'Payment Received', icon: TrendingUp, tile: 'bg-teal-50 text-teal-700 ring-teal-100', value: 'text-emerald-700' },
  vendor_payment: { label: 'Payment Made', icon: TrendingDown, tile: 'bg-rose-50 text-rose-700 ring-rose-100', value: 'text-rose-600' },
  expense: { label: 'Expense', icon: DollarSign, tile: 'bg-amber-50 text-amber-700 ring-amber-100', value: 'text-rose-600' },
};

const valueText = (item) => {
  if (item.type === 'production') return `${fmtNum(item.quantity)} pcs`;
  if (item.type === 'payment') return `+ ${fmt(item.amount)}`;
  if (item.type === 'sale') return fmt(item.amount);
  return `− ${fmt(item.amount)}`;
};

const dayHeading = (d) => {
  const date = dayjs(d);
  if (date.isSame(dayjs(), 'day')) return 'Today';
  if (date.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return date.format('dddd, D MMM YYYY');
};

export default function ActivityPage() {
  const [data, setData] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('last7');
  const [range, setRange] = useState(() => ({ from: dayjs().subtract(6, 'day').format(DATE_FMT), to: dayjs().format(DATE_FMT) }));
  const [custom, setCustom] = useState(range);
  const [plant, setPlant] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/plants').then(res => setPlants(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/activity', { params: { ...range, plant: plant || undefined } })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range, plant]);

  const selectRange = (key) => {
    setRangeKey(key);
    const preset = RANGES.find(r => r.key === key);
    if (preset?.get) {
      const [from, to] = preset.get();
      setRange({ from: from.format(DATE_FMT), to: to.format(DATE_FMT) });
    } else {
      setCustom(range);
    }
  };

  const customValid = custom.from && custom.to && custom.from <= custom.to;

  const items = data?.items || [];
  const q = search.trim().toLowerCase();
  const searched = items.filter(i => !q || `${i.title} ${i.detail} ${i.plant}`.toLowerCase().includes(q));
  const visible = searched.filter(i => !typeFilter || i.type === typeFilter);
  const typeCounts = searched.reduce((acc, i) => ({ ...acc, [i.type]: (acc[i.type] || 0) + 1 }), {});

  // Group the list by calendar day, keeping the newest-first order
  const days = [];
  visible.forEach(item => {
    const key = dayjs(item.date).format(DATE_FMT);
    const last = days[days.length - 1];
    if (last?.key === key) last.items.push(item);
    else days.push({ key, items: [item] });
  });

  const totals = data?.totals || {};
  const periodText = range.from === range.to
    ? dayjs(range.from).format('D MMM YYYY')
    : `${dayjs(range.from).format('D MMM YYYY')} – ${dayjs(range.to).format('D MMM YYYY')}`;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header + period */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Center</h1>
          <p className="page-subtitle">Every plant operation in one place · {periodText}</p>
        </div>
        <Segmented options={RANGES} value={rangeKey} onChange={selectRange} />
      </div>

      {rangeKey === 'custom' && (
        <div className="card flex flex-wrap items-end gap-3">
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

      {/* Period totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Hammer} label="Production" value={`${fmtNum(totals.production)} pcs`} tone="blue" />
        <StatCard icon={FileText} label="Sales" value={fmt(totals.sales)} tone="emerald" />
        <StatCard icon={TrendingUp} label="Collections" value={fmt(totals.collection)} tone="teal" />
        <StatCard icon={ShoppingCart} label="Purchases" value={fmt(totals.purchases)} tone="indigo" />
        <StatCard icon={DollarSign} label="Expenses" value={fmt(totals.expenses)} tone="amber" />
      </section>

      {/* Activity list */}
      <section className="panel">
        <div className="panel-header">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {['', ...Object.keys(TYPES)].map(type => {
                const active = typeFilter === type;
                const count = type ? typeCounts[type] || 0 : searched.length;
                return (
                  <button
                    key={type || 'all'}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    {type ? TYPES[type].label : 'All'}{' '}
                    <span className={active ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 md:shrink-0">
              {hasManyPlants(plants) && (
                <select className="input w-40 shrink-0" value={plant} onChange={e => setPlant(e.target.value)} aria-label="Plant">
                  <option value="">All Plants</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              )}
              <SearchInput className="min-w-0 flex-1 md:w-64 md:flex-none" value={search} onChange={setSearch} placeholder="Search activity..." />
            </div>
          </div>
        </div>

        {loading && !data ? (
          <LoadingState label="Loading activity…" />
        ) : visible.length === 0 ? (
          <EmptyState icon={Activity} title="No activity found" hint={q || typeFilter ? 'Try a different search or filter.' : 'Nothing was recorded in this period.'} />
        ) : (
          <div className={`transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            {days.map(day => (
              <div key={day.key}>
                <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-5">
                  {dayHeading(day.key)}
                  <span className="ml-2 font-medium normal-case tracking-normal text-slate-400">{day.items.length} {day.items.length === 1 ? 'entry' : 'entries'}</span>
                </p>
                <ul className="divide-y divide-slate-100">
                  {day.items.map(item => {
                    const t = TYPES[item.type];
                    const Icon = t.icon;
                    return (
                      <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 md:px-5">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${t.tile}`}>
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.title}
                            <span className="ml-2 text-xs font-medium text-slate-400">{t.label}</span>
                          </p>
                          <p className="truncate text-xs text-slate-500" title={item.detail}>
                            {[hasManyPlants(plants) && item.plant, item.detail].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        <p className={`shrink-0 whitespace-nowrap text-right text-sm font-bold ${t.value}`}>{valueText(item)}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className="table-footer">Showing {visible.length} of {items.length} entries</p>
      </section>
    </div>
  );
}
