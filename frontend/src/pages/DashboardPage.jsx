import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import ProductionTrendChart from '../components/ProductionTrendChart';
import Segmented from '../components/Segmented';
import { LoadingState } from '../components/States';
import {
  Hammer, FileText, Package, DollarSign, TrendingUp,
  AlertTriangle, Users, ShoppingCart, ChevronRight, HandCoins, Send, Layers
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import dayjs from 'dayjs';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'today', label: 'Today', get: () => [dayjs(), dayjs()] },
  { key: 'yesterday', label: 'Yesterday', get: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'year', label: 'This Year', get: () => [dayjs().startOf('year'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

const rangeLabel = (from, to) => from === to
  ? dayjs(from).format('D MMM YYYY')
  : `${dayjs(from).format('D MMM YYYY')} – ${dayjs(to).format('D MMM YYYY')}`;

// Shortcuts shown under the KPI cards; `?new=1` opens that page's add form straight away
const QUICK_ACTIONS = [
  { to: '/production?new=1', icon: Hammer, label: 'New Production', tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
  { to: '/sales?new=1', icon: FileText, label: 'New Sale', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  { to: '/purchases?new=1', icon: ShoppingCart, label: 'New Purchase', tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
  { to: '/expenses?new=1', icon: DollarSign, label: 'New Expense', tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
  { to: '/receipts?new=1', icon: HandCoins, label: 'Money Received', tone: 'bg-teal-50 text-teal-700 ring-teal-100' },
  { to: '/payments?new=1', icon: Send, label: 'Money Paid', tone: 'bg-rose-50 text-rose-700 ring-rose-100' },
];

// Shared chart styling
const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -12px rgba(15,23,42,0.25)', fontSize: 12 };
const CHART_BLUE = '#2563eb';
const CHART_GREEN = '#10b981';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('today');
  const [range, setRange] = useState(() => ({ from: dayjs().format(DATE_FMT), to: dayjs().format(DATE_FMT) }));
  const [custom, setCustom] = useState(range);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/summary', { params: range })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

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
  const applyCustom = () => { if (customValid) setRange({ ...custom }); };

  const periodLabel = RANGES.find(r => r.key === rangeKey)?.label;
  const periodText = rangeKey === 'custom' ? 'Selected range' : periodLabel;
  const byMonth = data?.groupBy === 'month';
  const tickFormat = d => byMonth ? dayjs(d).format('MMM') : dayjs(d).format('DD MMM');
  const labelFormat = d => byMonth ? dayjs(d).format('MMMM YYYY') : dayjs(d).format('DD MMM YYYY');

  const kpis = [
    { icon: Hammer, label: 'Production', value: fmtNum(data?.production) + ' pcs', tone: 'blue', hint: `Bricks produced · ${periodText}` },
    { icon: FileText, label: 'Sales', value: fmt(data?.sales), tone: 'emerald', hint: `Total invoiced · ${periodText}` },
    { icon: TrendingUp, label: 'Collections', value: fmt(data?.collection), tone: 'teal', hint: `Payments received · ${periodText}` },
    { icon: ShoppingCart, label: 'Purchases', value: fmt(data?.purchases), tone: 'indigo', hint: `Raw materials bought · ${periodText}` },
    { icon: DollarSign, label: 'Expenses', value: fmt(data?.expenses), tone: 'amber', hint: `Total spent · ${periodText}` },
    { icon: Users, label: 'Outstanding Dues', value: fmt(data?.outstanding), tone: 'rose', hint: 'Current balance (all time)' },
  ];

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header + date range filter */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {periodLabel} · {rangeLabel(range.from, range.to)}
          </p>
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
          <button className="btn-primary" onClick={applyCustom} disabled={!customValid}>Apply</button>
          {!customValid && <p className="pb-2 text-xs font-medium text-rose-600">"From" date must be on or before "To" date</p>}
        </div>
      )}

      {loading && !data ? (
        <LoadingState label="Loading dashboard…" />
      ) : (
      <div className={`space-y-4 transition-opacity md:space-y-5 ${loading ? 'pointer-events-none opacity-50' : ''}`}>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-3">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </section>

      {/* Quick actions: the app's blue as a band of colour, with white tiles on it (as in the crusher app) */}
      <section className="panel bg-gradient-to-r from-primary-700 to-primary-600 ring-primary-700">
        <div className="panel-header flex flex-wrap items-center justify-between gap-2 border-white/15 py-3">
          <div>
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            <p className="text-xs text-primary-100">Add today's entries straight from the dashboard</p>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-inset ring-white/35 transition hover:bg-white/25 md:text-sm"
          >
            <Layers size={16} />
            Brick Stock
          </Link>
        </div>
        {/* Wide screens get all six in one row, with the icon above the label while the row is tight */}
        <div className="grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-3 md:gap-2.5 md:p-3 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label, tone }) => (
            <Link
              key={label}
              to={to}
              className="group flex items-center gap-2 rounded-xl bg-white p-2 text-left shadow-sm transition hover:bg-primary-50 hover:shadow-md xl:flex-col xl:gap-1 xl:px-1 xl:text-center 2xl:flex-row 2xl:gap-2 2xl:px-2 2xl:text-left"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${tone}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0 text-[13.5px] font-semibold leading-tight text-slate-700 group-hover:text-slate-900 xl:text-[12.5px] 2xl:text-[13.5px]">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Low stock alert */}
      {data?.lowStockCount > 0 && (
        <Link to="/low-stock" className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 transition hover:border-amber-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">
              {data.lowStockCount} raw material{data.lowStockCount > 1 ? 's' : ''} running low
            </p>
            <p className="truncate text-xs text-slate-500">
              {data.lowStockItems?.slice(0, 3).map(m => m.name).join(', ')}
              {data.lowStockCount > 3 ? ` and ${data.lowStockCount - 3} more` : ''}
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-amber-600" />
        </Link>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <ProductionTrendChart
          rows={data?.productionTrend || []}
          types={data?.productionTypes || []}
          byMonth={byMonth}
          tickFormat={tickFormat}
          labelFormat={labelFormat}
        />

        <section className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-bold text-slate-900">Sales vs Collections</h3>
            <p className="text-xs text-slate-500">Invoiced and received {byMonth ? 'by month' : 'by day'}</p>
          </div>
          <div className="p-3 md:p-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.salesTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="_id" tick={AXIS_TICK} tickFormatter={tickFormat} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [fmt(v), n]} labelFormatter={labelFormat} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sales" stroke={CHART_BLUE} strokeWidth={2} dot={{ r: 3 }} name="Sales" />
                <Line type="monotone" dataKey="collection" stroke={CHART_GREEN} strokeWidth={2} dot={{ r: 3 }} name="Collection" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Low stock table */}
      {data?.lowStockItems?.length > 0 && (
        <section className="panel">
          <div className="panel-header flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Low Stock Materials</h3>
              <p className="text-xs text-slate-500">Below the minimum you set</p>
            </div>
            <span className="badge-red">{data.lowStockItems.length} low</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Material</th>
                  <th className="table-header">Current Stock</th>
                  <th className="table-header">Minimum Required</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((m, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
                          <Package size={18} />
                        </span>
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-rose-600">{m.currentStock} {m.unit}</td>
                    <td className="table-cell">{m.lowStockThreshold} {m.unit}</td>
                    <td className="table-cell"><span className="badge-red">Low Stock</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      </div>
      )}
    </div>
  );
}
