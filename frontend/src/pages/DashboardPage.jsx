import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import ProductionTrendChart from '../components/ProductionTrendChart';
import Segmented from '../components/Segmented';
import ProductionFormModal from '../components/ProductionFormModal';
import SaleFormModal from '../components/SaleFormModal';
import PurchaseFormModal from '../components/PurchaseFormModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import PartyPaymentModal from '../components/PartyPaymentModal';
import PartyCell from '../components/PartyCell';
import { LoadingState } from '../components/States';
import {
  Hammer, FileText, Package, DollarSign, TrendingUp,
  AlertTriangle, Users, ShoppingCart, ChevronRight, HandCoins, Send, Layers,
  ArrowDownLeft, ArrowUpRight, Scale, Banknote, Landmark
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

// Shortcuts shown under the KPI cards; each opens its form as a popup right here on the dashboard
const QUICK_ACTIONS = [
  { popup: 'production', icon: Hammer, label: 'New Production', tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
  { popup: 'sale', icon: FileText, label: 'New Sale', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  { popup: 'purchase', icon: ShoppingCart, label: 'New Purchase', tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
  { popup: 'expense', icon: DollarSign, label: 'New Expense', tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
  { popup: 'receipt', icon: HandCoins, label: 'Money Received', tone: 'bg-teal-50 text-teal-700 ring-teal-100' },
  { popup: 'payment', icon: Send, label: 'Money Paid', tone: 'bg-rose-50 text-rose-700 ring-rose-100' },
];

// The money popups pick from the party list, which the dashboard fetches when one is opened
const PAYMENT_TYPES = { receipt: 'customer', payment: 'vendor' };


// Shared chart styling
const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -12px rgba(15,23,42,0.25)', fontSize: 12 };
const CHART_BLUE = '#2563eb';
const CHART_GREEN = '#10b981';

/**
 * Top parties by what is due, from their ledger balances. Each row opens the party's ledger.
 * kind: 'collect' (they owe you) or 'pay' (you owe them)
 */
function DuesPanel({ kind, rows = [], total = 0, count = 0 }) {
  const collect = kind === 'collect';
  const Icon = collect ? HandCoins : Send;
  return (
    <section className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${collect ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100'}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">{collect ? 'To Collect' : 'To Pay'}</h3>
            <p className="truncate text-xs text-slate-500">{collect ? 'Parties who owe you the most' : 'Parties you owe the most'}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-bold ${collect ? 'text-emerald-700' : 'text-rose-600'}`}>{fmt(total)}</p>
          <p className="text-[11px] text-slate-500">{count} part{count === 1 ? 'y' : 'ies'} in all</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-10 text-sm text-slate-500">
          {collect ? 'Nobody owes you anything right now.' : "You don't owe anyone right now."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r, i) => {
            const share = total > 0 ? (r.balance / total) * 100 : 0;
            return (
              <li key={r._id}>
                <Link to={`/masters/parties/${r._id}/ledger`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50" title="Open the party's ledger">
                  <span className="w-4 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <PartyCell name={r.name} mobile={r.mobile} />
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    <p className={`font-bold ${collect ? 'text-emerald-700' : 'text-rose-600'}`}>{fmt(r.balance)}</p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100" title={`${share.toFixed(0)}% of the total`}>
                      <div className={`ml-auto h-full rounded-full ${collect ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${share}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Money in and money out of the cash / bank accounts for the period, what it was for, and by account. */
function CashflowPanel({ flow, periodText }) {
  if (!flow) return null;
  const outLines = [
    { label: 'Paid to parties', value: flow.paid },
    { label: 'Paid with purchases', value: flow.purchases },
    { label: 'Expenses', value: flow.expenses },
  ].filter(l => l.value > 0);
  const positive = flow.net >= 0;
  return (
    <section className="panel">
      <div className="panel-header flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Cashflow</h3>
          <p className="text-xs text-slate-500">Money in and out of your cash and bank accounts · {periodText}</p>
        </div>
        <Link to="/accounts" className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
          Cash & Bank <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"><ArrowDownLeft size={16} /></span>
            Money In
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{fmt(flow.in)}</p>
          <p className="mt-1 text-xs text-slate-500">{flow.received > 0 ? 'Received from parties' : 'Nothing received'}</p>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100"><ArrowUpRight size={16} /></span>
            Money Out
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{fmt(flow.out)}</p>
          {outLines.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">Nothing paid out</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
              {outLines.map(l => (
                <li key={l.label} className="flex justify-between gap-3"><span>{l.label}</span><span className="font-semibold text-slate-700">{fmt(l.value)}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${positive ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}><Scale size={16} /></span>
            Net Cashflow
          </p>
          <p className={`mt-2 text-2xl font-bold ${positive ? 'text-blue-700' : 'text-amber-600'}`}>{flow.net < 0 ? '−' : ''}{fmt(Math.abs(flow.net))}</p>
          <p className="mt-1 text-xs text-slate-500">{flow.net > 0 ? 'More came in than went out' : flow.net < 0 ? 'More went out than came in' : 'In and out are equal'}</p>
        </div>
      </div>
      {/* Where the money moved: each account with its in and out */}
      {flow.byAccount?.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
          {flow.byAccount.map(a => {
            const Icon = a.type === 'cash' ? Banknote : Landmark;
            return (
              <span key={a._id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs ring-1 ring-inset ring-slate-200">
                <Icon size={14} className={a.type === 'cash' ? 'text-amber-600' : 'text-indigo-600'} />
                <span className="font-semibold text-slate-700">{a.name}</span>
                {a.in > 0 && <span className="font-semibold text-emerald-700">+{fmt(a.in)}</span>}
                {a.out > 0 && <span className="font-semibold text-rose-600">−{fmt(a.out)}</span>}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('today');
  const [range, setRange] = useState(() => ({ from: dayjs().format(DATE_FMT), to: dayjs().format(DATE_FMT) }));
  const [custom, setCustom] = useState(range);
  const [popup, setPopup] = useState(null); // quick-action form open on the dashboard
  const [reload, setReload] = useState(0); // bumped after a quick entry is saved, to refresh the figures
  const [parties, setParties] = useState(null); // for the money popups, loaded on first use

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/summary', { params: range })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range, reload]);

  const openPopup = (key) => {
    if (PAYMENT_TYPES[key] && !parties) {
      api.get('/parties').then(res => setParties(res.data || [])).catch(e => alert(e.message || 'Could not load parties'));
    }
    setPopup(key);
  };
  const closePopup = () => setPopup(null);
  const savedPopup = () => { setPopup(null); setReload(r => r + 1); };

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
    { icon: Users, label: 'Outstanding Dues', value: fmt(data?.outstanding), tone: 'rose', hint: 'What parties owe you now, from their ledgers' },
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

      <CashflowPanel flow={data?.cashflow} periodText={periodText} />

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
          {QUICK_ACTIONS.map(({ popup: key, icon: Icon, label, tone }) => (
            <button
              key={label}
              type="button"
              onClick={() => openPopup(key)}
              className="group flex items-center gap-2 rounded-xl bg-white p-2 text-left shadow-sm transition hover:bg-primary-50 hover:shadow-md xl:flex-col xl:gap-1 xl:px-1 xl:text-center 2xl:flex-row 2xl:gap-2 2xl:px-2 2xl:text-left"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${tone}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0 text-[13.5px] font-semibold leading-tight text-slate-700 group-hover:text-slate-900 xl:text-[12.5px] 2xl:text-[13.5px]">{label}</span>
            </button>
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
          // Today / Yesterday still show a week, so the day can be compared with the ones before
          note={data?.productionTrendFrom && data.productionTrendFrom < data.from
            ? `Bricks produced by day, last ${data.productionTrend?.length || 7} days to ${dayjs(data.to).format('D MMM')}`
            : undefined}
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

      {/* Who owes you and whom you owe, right now (not limited to the date range) */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <DuesPanel kind="collect" rows={data?.dues?.topReceivable} total={data?.dues?.receivable} count={data?.dues?.receivableCount} />
        <DuesPanel kind="pay" rows={data?.dues?.topPayable} total={data?.dues?.payable} count={data?.dues?.payableCount} />
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

      {popup === 'production' && <ProductionFormModal onClose={closePopup} onSaved={savedPopup} />}
      {popup === 'sale' && <SaleFormModal onClose={closePopup} onSaved={savedPopup} />}
      {popup === 'purchase' && <PurchaseFormModal onClose={closePopup} onSaved={savedPopup} />}
      {popup === 'expense' && <ExpenseFormModal onClose={closePopup} onSaved={savedPopup} />}
      {/* This popup closes itself after saving */}
      {PAYMENT_TYPES[popup] && parties && (
        <PartyPaymentModal key={popup} type={PAYMENT_TYPES[popup]} parties={parties} onClose={closePopup} onSaved={() => setReload(r => r + 1)} />
      )}
    </div>
  );
}
