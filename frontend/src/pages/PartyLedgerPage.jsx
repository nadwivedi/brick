import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import PartyPaymentModal from '../components/PartyPaymentModal';
import { LoadingState, EmptyState } from '../components/States';
import { FileText, ShoppingCart, TrendingUp, Wallet, BookOpen, ChevronLeft, Receipt, Scale, Plus } from 'lucide-react';
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

// Wording and links for each kind of account
const KINDS = {
  customer: {
    listPath: '/masters/customers', backPath: '/masters/parties?type=customer', listEndpoint: '/customers', listLabel: 'Customers',
    subtitle: 'Every sale and every payment received, with the balance after each',
    increaseLabel: 'Sales', increaseHint: 'Invoiced in this period', increaseIcon: FileText,
    decreaseLabel: 'Received', decreaseHint: 'Received in this period',
    increaseHead: 'Sale', decreaseHead: 'Received',
    owes: 'will pay you', advance: 'advance with you', settled: 'Nothing due',
    payLabel: 'Receive Money', payShort: 'Receive',
  },
  vendor: {
    listPath: '/masters/vendors', backPath: '/masters/parties?type=vendor', listEndpoint: '/vendors', listLabel: 'Vendors',
    subtitle: 'Every purchase and every payment made, with the balance after each',
    increaseLabel: 'Purchases', increaseHint: 'Bought in this period', increaseIcon: ShoppingCart,
    decreaseLabel: 'Paid', decreaseHint: 'Paid in this period',
    increaseHead: 'Purchase', decreaseHead: 'Paid',
    owes: 'you have to pay', advance: 'advance with vendor', settled: 'Nothing due',
    payLabel: 'Pay Money', payShort: 'Pay',
  },
};

const ROW_TYPES = {
  sale: { icon: FileText, tile: 'bg-blue-50 text-blue-700 ring-blue-100' },
  purchase: { icon: ShoppingCart, tile: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  payment: { icon: TrendingUp, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
};

/** Account ledger for one customer or vendor. `type` is 'customer' or 'vendor'. */
export default function PartyLedgerPage({ type }) {
  const kind = KINDS[type];
  const { id } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState(null); // null = all time, else { from, to }
  const [custom, setCustom] = useState({ from: dayjs().startOf('month').format(DATE_FMT), to: dayjs().format(DATE_FMT) });
  const [paying, setPaying] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api.get(kind.listEndpoint).then(res => setParties(res.data || [])).catch(console.error);
  }, [kind.listEndpoint]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/party-ledger/${type}/${id}`, { params: range || {} })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [type, id, range, reload]);

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

  // A positive balance is money still owed; a negative one is an advance
  const balanceText = (n) => (n > 0 ? `${fmt(n)} ${kind.owes}` : n < 0 ? `${fmt(-n)} ${kind.advance}` : kind.settled);
  const balanceCell = (n) => (n < 0 ? `${fmt(-n)} Adv` : fmt(n));

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to={kind.backPath} className="icon-btn hidden bg-white ring-1 ring-slate-200 lg:block" title="Back to Parties" aria-label="Back to Parties">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Ledger{ledger ? ` — ${ledger.party.name}` : ''}</h1>
            <p className="page-subtitle">
              {ledger?.party.mobile ? `${ledger.party.mobile} · ` : ''}{kind.subtitle} · {periodText}
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:shrink-0">
          <select className="input flex-1 md:w-64 md:flex-none" value={id} onChange={e => navigate(`${kind.listPath}/${e.target.value}/ledger`)} aria-label={kind.listLabel}>
            {!parties.some(p => p._id === id) && <option value={id}>Select</option>}
            {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button className="btn-primary flex-shrink-0" onClick={() => setPaying(true)} disabled={parties.length === 0}>
            <Plus size={18} />
            <span className="hidden sm:inline">{kind.payLabel}</span>
            <span className="sm:hidden">{kind.payShort}</span>
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
            <StatCard icon={Receipt} label="Opening Balance" hint={range ? `Balance before ${dayjs(range.from).format('D MMM')}` : 'Saved on the account'} value={balanceCell(ledger.opening)} tone="slate" />
            <StatCard icon={kind.increaseIcon} label={kind.increaseLabel} hint={kind.increaseHint} value={fmt(ledger.totalIncrease)} tone="blue" />
            <StatCard icon={Wallet} label={kind.decreaseLabel} hint={kind.decreaseHint} value={fmt(ledger.totalDecrease)} tone="emerald" />
            <StatCard icon={Scale} label="Balance" hint={balanceText(ledger.closing)} value={balanceCell(ledger.closing)} tone={ledger.closing > 0 ? 'rose' : 'emerald'} />
          </section>

          {/* What is due right now, whatever period is selected */}
          <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${ledger.currentBalance > 0 ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50' : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${ledger.currentBalance > 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}>
              <Scale size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">As of today: {balanceText(ledger.currentBalance)}</p>
              <p className="text-xs text-slate-500">Current balance of this account across all dates</p>
            </div>
          </div>

          <section className="panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Details</th>
                    <th className="table-header text-right">{kind.increaseHead}</th>
                    <th className="table-header text-right">{kind.decreaseHead}</th>
                    <th className="table-header text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.to).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell font-bold text-slate-900">Closing balance</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{ledger.totalIncrease ? fmt(ledger.totalIncrease) : ''}</td>
                    <td className="table-cell whitespace-nowrap text-right font-bold text-emerald-700">{ledger.totalDecrease ? fmt(ledger.totalDecrease) : ''}</td>
                    <td className={`table-cell whitespace-nowrap text-right font-bold ${ledger.closing > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{balanceCell(ledger.closing)}</td>
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
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-800">{e.increase ? fmt(e.increase) : ''}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-emerald-700">{e.decrease ? fmt(e.decrease) : ''}</td>
                        <td className={`table-cell whitespace-nowrap text-right font-bold ${e.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{balanceCell(e.balance)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/60">
                    <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.from).format('DD MMM YYYY') : '—'}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">Opening balance</p>
                      <p className="text-xs text-slate-500">{range ? 'Balance carried forward from before this period' : 'Opening balance saved on the account'}</p>
                    </td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                    <td className="table-cell whitespace-nowrap text-right font-bold text-slate-800">{balanceCell(ledger.opening)}</td>
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
          type={type}
          parties={parties}
          partyId={id}
          onClose={() => setPaying(false)}
          onSaved={() => setReload(n => n + 1)}
        />
      )}
    </div>
  );
}
