import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import StatCard from './StatCard';
import Segmented from './Segmented';
import SearchInput from './SearchInput';
import BalanceCell from './BalanceCell';
import { LoadingState, EmptyState } from './States';
import { HandCoins, Send, FileText, ShoppingCart, BookOpen } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const day = (d) => dayjs(d).format('D MMM YYYY');
const amount = (n) => (n ? fmt(n) : <span className="text-slate-300">—</span>);

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'receive', label: 'To Receive' },
  { key: 'pay', label: 'To Pay' },
  { key: 'active', label: 'Active in Period' },
];
const MATCHES = {
  all: () => true,
  receive: (r) => r.closing > 0,
  pay: (r) => r.closing < 0,
  active: (r) => r.hasActivity,
};

/** Every party's opening balance, sales, purchases, payments and closing balance for a period. */
export default function PartyLedgerReport({ from, to }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/reports/party-ledger', { params: { from, to } })
      .then(res => setData(res.data))
      .catch(e => { setData(null); setError(e.message || 'Could not load the report'); })
      .finally(() => setLoading(false));
  }, [from, to]);

  if (error) return <section className="panel"><EmptyState icon={BookOpen} title="Could not load the party ledger" hint={error} /></section>;
  if (!data) return <LoadingState label="Loading party ledger…" />;

  const q = search.trim().toLowerCase();
  const rows = data.rows.filter(r => MATCHES[filter](r) && (!q || r.name.toLowerCase().includes(q) || (r.mobile || '').includes(q)));
  const sum = (key) => rows.reduce((s, r) => s + r[key], 0);
  const { totals } = data;

  return (
    <div className={`space-y-4 transition-opacity md:space-y-5 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={HandCoins} label="To Receive" hint={`Owed to you on ${day(data.to)}`} value={fmt(totals.receivable)} tone="emerald" />
        <StatCard icon={Send} label="To Pay" hint={`You owe on ${day(data.to)}`} value={fmt(totals.payable)} tone="rose" />
        <StatCard icon={FileText} label="Sold in Period" hint={`${fmt(totals.received)} received`} value={fmt(totals.sales)} tone="blue" />
        <StatCard icon={ShoppingCart} label="Bought in Period" hint={`${fmt(totals.paid)} paid`} value={fmt(totals.purchases)} tone="indigo" />
      </section>

      <section className="panel">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 md:flex-row md:items-center md:justify-between md:p-4">
          <Segmented options={FILTERS} value={filter} onChange={setFilter} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search party or mobile..." className="md:w-72" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={BookOpen} title="No parties to show" hint={data.rows.length ? 'Try another search or filter' : 'Add parties under Masters to see their ledger here'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Party</th>
                  <th className="table-header text-right">Opening</th>
                  <th className="table-header text-right">Sales</th>
                  <th className="table-header text-right">Received</th>
                  <th className="table-header text-right">Purchases</th>
                  <th className="table-header text-right">Paid</th>
                  <th className="table-header text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row cursor-pointer" onClick={() => navigate(`/masters/parties/${r._id}/ledger`)} title="Open full ledger">
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.mobile}{r.isActive === false ? ' · Inactive' : ''}</p>
                    </td>
                    <td className="table-cell whitespace-nowrap text-right font-semibold"><BalanceCell n={r.opening} /></td>
                    <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{amount(r.sales)}</td>
                    <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{amount(r.received)}</td>
                    <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{amount(r.purchases)}</td>
                    <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{amount(r.paid)}</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={r.closing} /></td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="table-cell font-bold text-slate-900">Total</td>
                  <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={sum('opening')} /></td>
                  <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(sum('sales'))}</td>
                  <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(sum('received'))}</td>
                  <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(sum('purchases'))}</td>
                  <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(sum('paid'))}</td>
                  <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={sum('closing')} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="table-footer">
          {rows.length} {rows.length === 1 ? 'party' : 'parties'} · Opening is the balance before {day(data.from)}, closing is the balance on {day(data.to)}. Click a party to see every entry.
        </p>
      </section>
    </div>
  );
}
