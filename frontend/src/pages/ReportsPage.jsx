import { useState, useEffect } from 'react';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import Segmented from '../components/Segmented';
import { BarChart2, TrendingUp, DollarSign, FileText, Download, Hammer, Wallet } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtN = (n) => (n || 0).toLocaleString('en-IN');

// Shared chart styling
const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -12px rgba(15,23,42,0.25)', fontSize: 12 };
const CHART_BLUE = '#2563eb';

const PRESETS = ['Today', 'This Week', 'This Month', 'Last Month'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('production');
  const [data, setData] = useState(null);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    api.get(`/dashboard/summary?from=${from}&to=${to}`)
      .then(res => setData(res.data))
      .catch(console.error);
  }, [from, to]);

  const tabs = [
    { key: 'production', label: 'Production', icon: BarChart2 },
    { key: 'sales', label: 'Sales', icon: TrendingUp },
    { key: 'expenses', label: 'Expenses', icon: DollarSign },
    { key: 'outstanding', label: 'Outstanding', icon: FileText },
  ];

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Business insights and performance metrics</p>
        </div>
        <button className="btn-secondary self-start">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Date Range */}
      <div className="card flex flex-wrap items-end gap-3 md:gap-4">
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input w-44" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input w-44" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 pb-0.5">
          {PRESETS.map((label, i) => (
            <button key={label} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300" onClick={() => {
              const presets = [
                [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                [dayjs().startOf('week').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                [dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')],
              ];
              setFrom(presets[i][0]); setTo(presets[i][1]);
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
          <StatCard icon={Hammer} label="Total Production" value={fmtN(data.production) + ' pcs'} tone="blue" />
          <StatCard icon={FileText} label="Total Sales" value={fmt(data.sales)} tone="emerald" />
          <StatCard icon={TrendingUp} label="Total Collection" value={fmt(data.collection)} tone="teal" />
          <StatCard icon={Wallet} label="Total Expenses" value={fmt(data.expenses)} tone="rose" />
        </section>
      )}

      {/* Tabs */}
      <Segmented options={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        {activeTab === 'production' && (
          <>
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-bold text-slate-900">Daily Production Trend</h3>
                <p className="text-xs text-slate-500">Bricks produced in the selected period</p>
              </div>
              <div className="p-3 md:p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data?.productionTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="_id" tick={AXIS_TICK} tickFormatter={d => dayjs(d).format('DD')} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={TOOLTIP_STYLE} formatter={v => [fmtN(v) + ' pcs', 'Production']} labelFormatter={d => dayjs(d).format('DD MMM')} />
                    <Bar dataKey="total" fill={CHART_BLUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-bold text-slate-900">Production Summary</h3>
                <p className="text-xs text-slate-500">Totals for the selected period</p>
              </div>
              <div className="divide-y divide-slate-100 px-4 md:px-5">
                <div className="flex justify-between py-3.5 text-sm">
                  <span className="text-slate-600">Total Produced</span>
                  <span className="font-bold text-slate-900">{fmtN(data?.production)} pcs</span>
                </div>
                <div className="flex justify-between py-3.5 text-sm">
                  <span className="text-slate-600">Average per Day</span>
                  <span className="font-bold text-slate-900">{fmtN(Math.round((data?.production || 0) / (dayjs(data?.to).diff(dayjs(data?.from), "day") + 1)))} pcs</span>
                </div>
                <div className="flex justify-between py-3.5 text-sm">
                  <span className="text-slate-600">Low Stock Items</span>
                  <span className="font-bold text-rose-600">{data?.lowStockCount || 0} items</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'sales' && (
          <>
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-bold text-slate-900">Sales Trend</h3>
                <p className="text-xs text-slate-500">Invoiced amount in the selected period</p>
              </div>
              <div className="p-3 md:p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data?.salesTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="_id" tick={AXIS_TICK} tickFormatter={d => dayjs(d).format('DD')} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v)} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v), 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke={CHART_BLUE} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-bold text-slate-900">Sales vs Collections</h3>
                <p className="text-xs text-slate-500">How much of the invoiced amount is collected</p>
              </div>
              <div className="space-y-4 p-4 md:p-5">
                <div>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-600">Total Sales</span><span className="font-bold text-slate-900">{fmt(data?.sales)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-primary-600" style={{ width: '100%' }}></div></div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-600">Collections</span><span className="font-bold text-emerald-700">{fmt(data?.collection)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${data?.sales ? Math.min(100, (data.collection / data.sales) * 100) : 0}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-600">Outstanding</span>
                  <span className="font-bold text-rose-600">{fmt(data?.outstanding)}</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'expenses' && (
          <div className="lg:col-span-2">
            <StatCard icon={Wallet} label="Expense Summary" hint="Total expenses in selected period" value={fmt(data?.expenses)} tone="rose" />
          </div>
        )}

        {activeTab === 'outstanding' && (
          <div className="lg:col-span-2">
            <StatCard icon={FileText} label="Customer Outstanding" hint="Total amount due from customers" value={fmt(data?.outstanding)} tone="rose" />
          </div>
        )}
      </div>
    </div>
  );
}
