import { useEffect, useState } from 'react';
import api from '../lib/api';
import StatCard from './StatCard';
import { LoadingState, EmptyState } from './States';
import { TrendingUp, TrendingDown, Wallet, Hammer, Scale } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtN = (n) => (n || 0).toLocaleString('en-IN');
const day = (d) => dayjs(d).format('D MMM YYYY');

/** One row of the statement: label (+ small hint) on the left, amount on the right. */
function Line({ label, hint, value, minus }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <span className={`shrink-0 font-semibold ${minus ? 'text-rose-600' : 'text-slate-800'}`}>{minus ? `− ${fmt(value)}` : fmt(value)}</span>
    </div>
  );
}

const Group = ({ title, children }) => (
  <div className="py-2">
    <p className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

function Statement({ title, subtitle, total, totalLabel, tone, children }) {
  return (
    <section className="panel flex flex-col">
      <div className="panel-header">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex-1 divide-y divide-slate-100 px-4 md:px-5">{children}</div>
      <div className={`flex items-center justify-between border-t-2 px-4 py-3.5 md:px-5 ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
        <span className="text-sm font-bold text-slate-900">{totalLabel}</span>
        <span className={`text-lg font-bold ${tone === 'emerald' ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(total)}</span>
      </div>
    </section>
  );
}

/** Profit & loss for a period: income from sales against material and other expenses. */
export default function ProfitLossReport({ from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/reports/profit-loss', { params: { from, to } })
      .then(res => setData(res.data))
      .catch(e => { setData(null); setError(e.message || 'Could not load the report'); })
      .finally(() => setLoading(false));
  }, [from, to]);

  if (error) return <section className="panel"><EmptyState icon={Scale} title="Could not load profit & loss" hint={error} /></section>;
  if (!data) return <LoadingState label="Loading profit & loss…" />;

  const { income, costs, netProfit } = data;
  const profit = netProfit >= 0;
  const period = data.from === data.to ? day(data.from) : `${day(data.from)} – ${day(data.to)}`;

  return (
    <div className={`space-y-4 transition-opacity md:space-y-5 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Income" hint={`${income.invoiceCount} ${income.invoiceCount === 1 ? 'sale' : 'sales'} in this period`} value={fmt(income.total)} tone="emerald" />
        <StatCard icon={Wallet} label="Total Expense" hint="Material, hired vehicles + other expenses" value={fmt(costs.total)} tone="rose" />
        <StatCard icon={profit ? TrendingUp : TrendingDown} label={profit ? 'Net Profit' : 'Net Loss'} hint={income.total ? `${data.margin.toFixed(1)}% of income` : 'No income in this period'} value={fmt(Math.abs(netProfit))} tone={profit ? 'emerald' : 'rose'} />
        <StatCard icon={Hammer} label="Cost per Brick" hint={`${fmtN(data.production)} pcs produced`} value={data.production ? `₹${data.costPerBrick.toFixed(2)}` : '—'} tone="amber" />
      </section>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <Statement title="Income" subtitle={`Sales billed · ${period}`} total={income.total} totalLabel="Total Income" tone="emerald">
          <Group title="Brick sales">
            {income.bricks.length === 0
              ? <p className="py-2.5 text-sm text-slate-400">No sales in this period</p>
              : income.bricks.map(b => <Line key={b.name} label={b.name} hint={`${fmtN(b.quantity)} pcs`} value={b.amount} />)}
          </Group>
          {(income.transport > 0 || income.loading > 0 || income.discount > 0) && (
            <Group title="Other charges">
              {income.transport > 0 && <Line label="Transport charged" value={income.transport} />}
              {income.loading > 0 && <Line label="Loading charged" value={income.loading} />}
              {income.discount > 0 && <Line label="Discount given" value={income.discount} minus />}
            </Group>
          )}
          {income.gstCollected > 0 && (
            <p className="py-2.5 text-xs text-slate-400">GST of {fmt(income.gstCollected)} collected on these sales is not counted as income.</p>
          )}
        </Statement>

        <Statement title="Expense" subtitle={`Production cost · ${period}`} total={costs.total} totalLabel="Total Expense" tone="rose">
          <Group title="Raw material bought">
            {costs.materials.length === 0
              ? <p className="py-2.5 text-sm text-slate-400">No purchases in this period</p>
              : costs.materials.map(m => <Line key={m.name} label={m.name} hint={`${fmtN(m.quantity)} ${m.unit}`.trim()} value={m.amount} />)}
            {costs.purchaseTransport > 0 && <Line label="Transport on purchases" value={costs.purchaseTransport} />}
          </Group>
          {costs.hiredTransport > 0 && (
            <Group title="Delivery">
              <Line label="Hired vehicles" hint="Owed to transporters for sale deliveries" value={costs.hiredTransport} />
            </Group>
          )}
          <Group title="Other expenses">
            {costs.expenses.length === 0
              ? <p className="py-2.5 text-sm text-slate-400">No expenses in this period</p>
              : costs.expenses.map(e => <Line key={e.name} label={e.name} hint={`${e.count} ${e.count === 1 ? 'entry' : 'entries'}`} value={e.amount} />)}
          </Group>
        </Statement>
      </div>

      {/* Bottom line */}
      <div className={`flex flex-wrap items-center gap-3 rounded-xl border-2 px-4 py-3.5 ${profit ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50' : 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50'}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${profit ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <Scale size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{profit ? 'Net Profit' : 'Net Loss'} for {period}</p>
          <p className="text-xs text-slate-500">Total income {fmt(income.total)} − total expense {fmt(costs.total)}</p>
        </div>
        <span className={`text-xl font-bold md:text-2xl ${profit ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(Math.abs(netProfit))}</span>
      </div>
    </div>
  );
}
