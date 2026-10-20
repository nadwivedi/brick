import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import PartyPaymentModal from '../components/PartyPaymentModal';
import BalanceCell, { balanceText } from '../components/BalanceCell';
import { LoadingState, EmptyState } from '../components/States';
import { FileText, ShoppingCart, HandCoins, Send, BookOpen, ChevronLeft, Receipt, Scale, Truck } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'all', label: 'All Time', get: () => null },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'month', label: 'This Month', get: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

const ROW_TYPES = {
  sale: { icon: FileText, tile: 'bg-blue-50 text-blue-700 ring-blue-100' },
  purchase: { icon: ShoppingCart, tile: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  received: { icon: HandCoins, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  paid: { icon: Send, tile: 'bg-rose-50 text-rose-700 ring-rose-100' },
  transport: { icon: Truck, tile: 'bg-amber-50 text-amber-700 ring-amber-100' }, // their vehicle hired for a sale
};

/** Account ledger for one party: sales and purchases with them, and money both ways. */
export default function PartyLedgerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState(null); // null = all time, else { from, to }
  const [custom, setCustom] = useState({ from: dayjs().startOf('month').format(DATE_FMT), to: dayjs().format(DATE_FMT) });
  const [paying, setPaying] = useState(null); // 'customer' = receive money, 'vendor' = pay money
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api.get('/parties').then(res => setParties((res.data || []).sort((a, b) => a.name.localeCompare(b.name)))).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/party-ledger/${id}`, { params: range || {} })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [id, range, reload]);

  const selectRange = (key) => {
    setRangeKey(key);
    const preset = RANGES.find(r => r.key === key);
    if (!preset.get) return; // custom: wait for Apply
    const dates = preset.get();
    setRange(dates ? { from: dates[0].format(DATE_FMT), to: dates[1].format(DATE_FMT) } : null);
  };

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
          <Link to="/masters/parties" className="icon-btn hidden bg-white ring-1 ring-slate-200 lg:block" title="Back to Parties" aria-label="Back to Parties">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Ledger{ledger ? ` — ${ledger.party.name}` : ''}</h1>
            <p className="page-subtitle">
              {ledger?.party.mobile ? `${ledger.party.mobile} · ` : ''}Sales, purchases and payments with this party · {periodText}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0">
          <select className="input min-w-0 flex-1 md:w-56 md:flex-none" value={id} onChange={e => navigate(`/masters/parties/${e.target.value}/ledger`)} aria-label="Party">
            {!parties.some(p => p._id === id) && <option value={id}>Select</option>}
            {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button className="btn-primary flex-shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => setPaying('customer')} disabled={!ledger}>
            <HandCoins size={16} /> Receive
          </button>
          <button className="btn-primary flex-shrink-0 bg-rose-600 hover:bg-rose-700" onClick={() => setPaying('vendor')} disabled={!ledger}>
            <Send size={16} /> Pay
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
            <StatCard icon={Receipt} label="Opening Balance" hint={range ? `Balance before ${dayjs(range.from).format('D MMM')}` : 'Saved on the party'} value={<BalanceCell n={ledger.opening} />} tone="slate" />
            <StatCard icon={FileText} label="Sold to them" hint={`${fmt(ledger.received)} received in this period`} value={fmt(ledger.sales)} tone="blue" />
            <StatCard icon={ShoppingCart} label="Bought from them" hint={`${fmt(ledger.paid)} paid in this period`} value={fmt(ledger.purchases)} tone="indigo" />
            <StatCard icon={Scale} label="Balance" hint={balanceText(ledger.closing)} value={<BalanceCell n={ledger.closing} />} tone={ledger.closing < 0 ? 'rose' : 'emerald'} />
          </section>

          {/* What is due right now, whatever period is selected */}
          <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${ledger.currentBalance < 0 ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50' : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${ledger.currentBalance < 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}>
              <Scale size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">As of today: {balanceText(ledger.currentBalance)}</p>
              <p className="text-xs text-slate-500">Current balance with this party across all dates</p>
            </div>
          </div>

          <section className="panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Details</th>
                    <th className="table-header text-right">Debit <span className="font-normal normal-case text-slate-400">(sale / paid)</span></th>
                    <th className="table-header text-right">Credit <span className="font-normal normal-case text-slate-400">(received / purchase / hire)</span></th>
                    <th className="table-header text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.to).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell font-bold text-slate-900">Closing balance</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{ledger.totalDebit ? fmt(ledger.totalDebit) : ''}</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{ledger.totalCredit ? fmt(ledger.totalCredit) : ''}</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={ledger.closing} /></td>
                  </tr>
                  {/* Newest first: the latest sale, purchase or payment is on top */}
                  {[...ledger.entries].reverse().map((e, i) => {
                    const t = ROW_TYPES[e.type];
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
                              <p className="font-semibold text-slate-800">{e.title}</p>
                              <p className="text-xs text-slate-500">{[e.plant, e.detail].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{e.debit ? fmt(e.debit) : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{e.credit ? fmt(e.credit) : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={e.balance} /></td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/60">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.from).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">Opening balance</p>
                      <p className="text-xs text-slate-500">{range ? 'Balance carried forward from before this period' : 'Opening balance saved on the party'}</p>
                    </td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                    <td className="table-cell whitespace-nowrap text-right font-bold"><BalanceCell n={ledger.opening} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="table-footer">
              {ledger.entries.length === 0
                ? 'Nothing recorded in this period.'
                : `${ledger.entries.length} ${ledger.entries.length === 1 ? 'entry' : 'entries'} in this period`}
            </p>
          </section>
        </div>
      )}

      {paying && (
        <PartyPaymentModal
          type={paying}
          parties={parties}
          partyId={id}
          onClose={() => setPaying(null)}
          onSaved={() => setReload(n => n + 1)}
        />
      )}
    </div>
  );
}
