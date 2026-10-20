import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { TransferModal } from '../components/AccountModals';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BookOpen, ChevronLeft, HandCoins, Send, ShoppingCart, Trash2, Wallet, Receipt } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'month', label: 'This Month', get: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'today', label: 'Today', get: () => [dayjs(), dayjs()] },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'all', label: 'All Time', get: () => null },
  { key: 'custom', label: 'Custom' },
];
const rangeFor = (key) => {
  const dates = RANGES.find(r => r.key === key).get();
  return dates ? { from: dates[0].format(DATE_FMT), to: dates[1].format(DATE_FMT) } : null;
};

// How each kind of entry looks, and where it is managed
const ROW_TYPES = {
  received: { label: 'Money received', icon: HandCoins, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100', to: '/receipts' },
  paid: { label: 'Money paid', icon: Send, tile: 'bg-rose-50 text-rose-700 ring-rose-100', to: '/payments' },
  purchase: { label: 'Purchase', icon: ShoppingCart, tile: 'bg-indigo-50 text-indigo-700 ring-indigo-100', to: '/purchases' },
  expense: { label: 'Expense', icon: Receipt, tile: 'bg-amber-50 text-amber-700 ring-amber-100', to: '/expenses' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, tile: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

/** One cash / bank account's entries for a period, each with the balance after it. */
export default function AccountLedgerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]); // summary rows, for the account switcher and transfers
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('month');
  const [range, setRange] = useState(() => rangeFor('month'));
  const [custom, setCustom] = useState(() => rangeFor('month'));
  const [transferring, setTransferring] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api.get('/accounts/summary').then(res => setAccounts(res.data?.accounts || [])).catch(console.error);
  }, [reload]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/accounts/${id}/ledger`, { params: range || {} })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [id, range, reload]);

  const selectRange = (key) => {
    setRangeKey(key);
    if (key !== 'custom') setRange(rangeFor(key));
  };
  const customValid = custom.from && custom.to && custom.from <= custom.to;

  const saveTransfer = async (payload) => {
    await api.post('/accounts/transfers', payload);
    setTransferring(false);
    setReload(n => n + 1);
  };

  const deleteTransfer = async (e) => {
    if (!confirm(`Delete this transfer of ${fmt(e.moneyIn || e.moneyOut)}? Both accounts will be corrected.`)) return;
    try {
      await api.delete(`/accounts/transfers/${e.refId}`);
      setReload(n => n + 1);
    } catch (err) { alert(err.message || 'Could not delete the transfer'); }
  };

  const account = ledger?.account;
  const periodText = !range
    ? 'All time'
    : range.from === range.to
      ? dayjs(range.from).format('D MMM YYYY')
      : `${dayjs(range.from).format('D MMM YYYY')} – ${dayjs(range.to).format('D MMM YYYY')}`;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/accounts" className="icon-btn hidden bg-white ring-1 ring-slate-200 lg:block" title="Back to Cash & Bank" aria-label="Back to Cash & Bank">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title flex flex-wrap items-center gap-2">
              {account?.name || 'Account Ledger'}
              {account && <span className={account.type === 'cash' ? 'badge-green' : 'badge-blue'}>{account.type === 'cash' ? 'Cash' : 'Bank'}</span>}
            </h1>
            <p className="page-subtitle">Money in and out of this account · {periodText}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0">
          <select className="input min-w-0 flex-1 md:w-56 md:flex-none" value={id} onChange={e => navigate(`/accounts/${e.target.value}`)} aria-label="Account">
            {!accounts.some(a => a._id === id) && <option value={id}>Select</option>}
            {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          <button className="btn-secondary flex-shrink-0" onClick={() => setTransferring(true)} disabled={!accounts.length}>
            <ArrowLeftRight size={16} /> Transfer
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Segmented options={RANGES} value={rangeKey} onChange={selectRange} />
        {rangeKey === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={custom.from} max={custom.to || undefined} onChange={e => setCustom({ ...custom, from: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={custom.to} min={custom.from || undefined} onChange={e => setCustom({ ...custom, to: e.target.value })} />
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
            <StatCard icon={Wallet} label="Opening Balance" hint={range ? `Before ${dayjs(range.from).format('D MMM')}` : 'Saved on the account'} value={fmt(ledger.opening)} tone="slate" />
            <StatCard icon={ArrowDownLeft} label="Money In" hint={`${ledger.entries.filter(e => e.moneyIn).length} entries`} value={fmt(ledger.moneyIn)} tone="emerald" />
            <StatCard icon={ArrowUpRight} label="Money Out" hint={`${ledger.entries.filter(e => e.moneyOut).length} entries`} value={fmt(ledger.moneyOut)} tone="rose" />
            <StatCard icon={Wallet} label="Closing Balance" hint={range ? `On ${dayjs(range.to).format('D MMM')}` : 'Balance now'} value={fmt(ledger.closing)} tone={ledger.closing < 0 ? 'rose' : 'blue'} />
          </section>

          <section className="panel">
            {ledger.entries.length === 0 ? (
              <EmptyState icon={BookOpen} title="No entries in this period" hint={`The balance stays at ${fmt(ledger.closing)}.`} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Details</th>
                      <th className="table-header text-right">Money In</th>
                      <th className="table-header text-right">Money Out</th>
                      <th className="table-header text-right">Balance</th>
                      <th className="table-header" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.to).format('DD MMM YYYY') : '—'}</td>
                      <td className="table-cell font-bold text-slate-900">Closing balance</td>
                      <td className="table-cell whitespace-nowrap text-right font-bold text-emerald-700">{fmt(ledger.moneyIn)}</td>
                      <td className="table-cell whitespace-nowrap text-right font-bold text-rose-600">{fmt(ledger.moneyOut)}</td>
                      <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(ledger.closing)}</td>
                      <td className="table-cell" />
                    </tr>
                    {/* Newest first */}
                    {[...ledger.entries].reverse().map((e, i) => {
                      const t = ROW_TYPES[e.type] || ROW_TYPES.transfer;
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
                                <p className="text-xs text-slate-500">
                                  {t.to ? <Link to={t.to} className="hover:text-primary-600 hover:underline">{t.label}</Link> : t.label}
                                  {e.detail ? ` · ${e.detail}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell whitespace-nowrap text-right font-semibold text-emerald-700">{e.moneyIn ? fmt(e.moneyIn) : ''}</td>
                          <td className="table-cell whitespace-nowrap text-right font-semibold text-rose-600">{e.moneyOut ? fmt(e.moneyOut) : ''}</td>
                          <td className={`table-cell whitespace-nowrap text-right font-bold ${e.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{fmt(e.balance)}</td>
                          <td className="table-cell text-right">
                            {e.type === 'transfer' && (
                              <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete transfer" onClick={() => deleteTransfer(e)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
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
                      <td className="table-cell whitespace-nowrap text-right font-bold text-slate-900">{fmt(ledger.opening)}</td>
                      <td className="table-cell" />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <p className="table-footer">{ledger.entries.length} {ledger.entries.length === 1 ? 'entry' : 'entries'} in this period</p>
          </section>
        </div>
      )}

      {transferring && (
        <TransferModal accounts={accounts} fromId={id} onSave={saveTransfer} onClose={() => setTransferring(false)} />
      )}
    </div>
  );
}
