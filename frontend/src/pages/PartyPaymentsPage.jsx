import { useState, useEffect } from 'react';
import useOpenOnNew from '../hooks/useOpenOnNew';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import PartyPaymentModal from '../components/PartyPaymentModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, HandCoins, Send, CalendarDays, Sun, Banknote, Landmark, BookOpen } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const MODE_LABELS = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', credit: 'Credit' };

// Wording, endpoints and links for each direction of money
const KINDS = {
  customer: {
    endpoint: '/receipts', partyKey: 'customer',
    title: 'Money Received', subtitle: 'Every payment received from parties, and the cash / bank account it went into',
    addLabel: 'Receive Money', icon: HandCoins, noun: 'receipt', todayTone: 'emerald', amountClass: 'text-emerald-700',
    searchPlaceholder: 'Search party or reference...',
    emptyTitle: 'No money received found', emptyHint: 'Record the first payment you receive from a party.',
    deleteText: (r) => `Delete this receipt of ${fmt(r.amount)} from ${r.customer?.name || 'this party'}?${r.invoice?.invoiceNumber ? ` Invoice ${r.invoice.invoiceNumber} will show this amount as on credit.` : ''} The party's balance goes up by this amount.`,
    deleteError: 'Could not delete the receipt',
    linkedText: (r) => (r.invoice?.invoiceNumber ? `For ${r.invoice.invoiceNumber}` : ''),
  },
  vendor: {
    endpoint: '/vendor-payments', partyKey: 'vendor',
    title: 'Money Paid', subtitle: 'Every payment made to parties, and the cash / bank account it came out of',
    addLabel: 'Pay Money', icon: Send, noun: 'payment', todayTone: 'rose', amountClass: 'text-rose-600',
    searchPlaceholder: 'Search party or reference...',
    emptyTitle: 'No money paid found', emptyHint: 'Record the first payment you make to a party.',
    deleteText: (r) => `Delete this payment of ${fmt(r.amount)} to ${r.vendor?.name || 'this party'}?`,
    deleteError: 'Could not delete the payment',
    linkedText: (r) => (r.purchase ? `Paid with purchase${r.purchase.billNumber ? ` · Bill ${r.purchase.billNumber}` : ''}` : ''),
  },
};

/** List of money received from parties or money paid to them. `type` is 'customer' (received) or 'vendor' (paid). */
export default function PartyPaymentsPage({ type }) {
  const kind = KINDS[type];
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // entry open in the edit popup
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([api.get(kind.endpoint), api.get('/parties')]);
      setPayments(rRes.data || []);
      setParties(pRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useOpenOnNew(!loading, () => setShowForm(true));

  const handleDelete = async (r) => {
    if (!confirm(kind.deleteText(r))) return;
    try {
      await api.delete(`${kind.endpoint}/${r._id}`);
      fetchData();
    } catch (e) { alert(e.message || kind.deleteError); }
  };

  const partyOf = (r) => r[kind.partyKey];
  const q = search.toLowerCase();
  const searched = payments.filter(r =>
    (partyOf(r)?.name || '').toLowerCase().includes(q) ||
    (partyOf(r)?.mobile || '').includes(q) ||
    (r.referenceNumber || '').toLowerCase().includes(q) ||
    (r.notes || '').toLowerCase().includes(q)
  );
  const filtered = searched.filter(r => !accountFilter || r.account?._id === accountFilter);
  const accountCounts = searched.reduce((acc, r) => ({ ...acc, [r.account?._id]: (acc[r.account?._id] || 0) + 1 }), {});
  // One filter per account that has entries
  const accountFilters = [{ key: '', label: 'All' }, ...Object.values(Object.fromEntries(
    payments.filter(r => r.account?._id).map(r => [r.account._id, { key: r.account._id, label: r.account.name }])
  ))];

  const sum = (list) => list.reduce((t, r) => t + (r.amount || 0), 0);
  const today = payments.filter(r => dayjs(r.date).isSame(dayjs(), 'day'));
  const month = payments.filter(r => dayjs(r.date).isSame(dayjs(), 'month'));
  const isCash = (r) => (r.account ? r.account.type === 'cash' : r.mode === 'cash');
  const monthCash = month.filter(isCash);
  const monthOther = month.filter(r => !isCash(r));
  const count = (n) => `${n} ${kind.noun}${n === 1 ? '' : 's'}`;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Sun} label="Today" hint={count(today.length)} value={fmt(sum(today))} tone={kind.todayTone} />
        <StatCard icon={CalendarDays} label="This Month" hint={`${count(month.length)} in ${dayjs().format('MMMM')}`} value={fmt(sum(month))} tone="blue" />
        <StatCard icon={Banknote} label="Cash This Month" hint={count(monthCash.length)} value={fmt(sum(monthCash))} tone="amber" />
        <StatCard icon={Landmark} label="Bank This Month" hint={count(monthOther.length)} value={fmt(sum(monthOther))} tone="indigo" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">{kind.title}</h1>
              <p className="page-subtitle">{kind.subtitle}</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder={kind.searchPlaceholder} />
              <button className="btn-primary flex-shrink-0" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                <span className="hidden sm:inline">{kind.addLabel}</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Account filter */}
          <div className="scrollbar-hide mt-2.5 flex gap-2 overflow-x-auto">
            {accountFilters.map(({ key, label }) => {
              const active = accountFilter === key;
              const n = key ? accountCounts[key] || 0 : searched.length;
              return (
                <button
                  key={key || 'all'}
                  type="button"
                  onClick={() => setAccountFilter(key)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {label}{' '}
                  <span className={active ? 'text-slate-300' : 'text-slate-400'}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <LoadingState label={`Loading ${kind.noun}s…`} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={kind.icon} title={kind.emptyTitle} hint={search || accountFilter ? 'Try a different search or filter.' : kind.emptyHint} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead><tr>
                <th className="table-header">Date</th>
                <th className="table-header">Party</th>
                <th className="table-header">Account</th>
                <th className="table-header">Details</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => {
                  const party = partyOf(r);
                  const details = [
                    kind.linkedText(r),
                    r.referenceNumber ? `Ref ${r.referenceNumber}` : '',
                    r.notes,
                  ].filter(Boolean).join(' · ');
                  return (
                    <tr key={r._id} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{dayjs(r.date).format('DD MMM YYYY')}</p>
                        <p className="text-xs text-slate-500">{dayjs(r.date).format('dddd')}</p>
                      </td>
                      <td className="table-cell">
                        <PartyCell name={party?.name} mobile={party?.mobile} />
                      </td>
                      <td className="table-cell">
                        <p className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-slate-700">
                          {isCash(r) ? <Banknote size={14} className="text-amber-600" /> : <Landmark size={14} className="text-indigo-600" />}
                          {r.account?.name || MODE_LABELS[r.mode] || r.mode}
                        </p>
                        {r.account && r.mode !== 'cash' && <p className="text-xs text-slate-500">{MODE_LABELS[r.mode] || r.mode}</p>}
                      </td>
                      <td className="table-cell">
                        <p className="max-w-[260px] truncate" title={details}>{details || '-'}</p>
                      </td>
                      <td className={`table-cell whitespace-nowrap text-right text-base font-bold ${kind.amountClass}`}>{fmt(r.amount)}</td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          {party?._id && (
                            <Link className="btn-secondary btn-sm mr-1 whitespace-nowrap" to={`/masters/parties/${party._id}/ledger`}>
                              <BookOpen size={14} /> Ledger
                            </Link>
                          )}
                          {/* An amount paid along with a purchase belongs to that purchase */}
                          {r.purchase ? (
                            <>
                              <span className="icon-btn invisible" aria-hidden="true"><Edit2 size={16} /></span>
                              <span className="icon-btn invisible" aria-hidden="true"><Trash2 size={16} /></span>
                            </>
                          ) : (
                            <>
                              <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => setEditing(r)}>
                                <Edit2 size={16} />
                              </button>
                              <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(r)}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer flex items-center justify-between gap-3">
          <span>Showing {filtered.length} of {payments.length} {kind.noun}s</span>
          <span className={`font-semibold ${kind.amountClass}`}>Total: {fmt(sum(filtered))}</span>
        </div>
      </section>

      {showForm && (
        <PartyPaymentModal type={type} parties={parties} onClose={() => setShowForm(false)} onSaved={fetchData} />
      )}
      {editing && (
        <PartyPaymentModal type={type} parties={parties} payment={editing} onClose={() => setEditing(null)} onSaved={fetchData} />
      )}
    </div>
  );
}
