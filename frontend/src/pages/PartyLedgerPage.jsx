import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import PartyPaymentModal from '../components/PartyPaymentModal';
import { LoadingState, EmptyState } from '../components/States';
import { ShoppingCart, HandCoins, Send, BookOpen, ChevronLeft, Scale, ArrowUpRight, ArrowDownLeft, Inbox } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${Math.round(Math.abs(n || 0)).toLocaleString('en-IN')}`;
// "₹12,000 Dr" (they owe you) / "₹8,000 Cr" (you owe them)
const drCr = (n) => (n ? `${fmt(n)} ${n > 0 ? 'Dr' : 'Cr'}` : fmt(0));
const balanceTone = (n) => (n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-600' : 'text-slate-500');

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'all', label: 'All Time', get: () => null },
  { key: 'last7', label: '7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: '30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'month', label: 'This Month', get: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'year', label: '1 Year', get: () => [dayjs().subtract(1, 'year').add(1, 'day'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

const TYPE_BADGES = {
  sale: 'badge-orange',
  purchase: 'badge-green',
  received: 'badge-blue',
  paid: 'badge-gray',
  transport: 'badge-red', // their vehicle hired for a sale
};

// Sales and purchases carry their own amount, paid and due
const hasPaid = (r) => r.paidAmount != null;

/** Ledger of one party, like a ledger book: newest first, one row per sale, purchase or payment. */
export default function PartyLedgerPage() {
  const { id } = useParams();
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

  // Newest first; each row shows the balance after it
  const rows = ledger ? [...ledger.entries].reverse() : [];
  const party = ledger?.party;
  const now = ledger?.currentBalance || 0;

  // Balance and the latest entries as a WhatsApp message to the party
  const shareOnWhatsApp = () => {
    const digits = String(party?.mobile || '').replace(/\D/g, '');
    if (!digits) return;
    const lines = [
      `*${party.name}* · Ledger`,
      now > 0 ? `Balance to pay us: ${fmt(now)}` : now < 0 ? `We owe you: ${fmt(now)}` : 'Balance: settled',
      '',
      ...rows.slice(0, 10).map(r => `${dayjs(r.date).format('DD MMM')} · ${r.label}${r.refNumber ? ` ${r.refNumber}` : ''} · ${fmt(r.amount)}${hasPaid(r) && r.paidAmount ? ` (paid ${fmt(r.paidAmount)})` : ''} · Bal ${drCr(r.balance)}`),
    ];
    const phone = digits.length === 10 ? `91${digits}` : digits;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/masters/parties" className="icon-btn shrink-0 bg-white ring-1 ring-slate-200" title="Back to Parties" aria-label="Back to Parties">
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{party?.name || 'Party Ledger'}</h1>
            <p className="page-subtitle truncate">{[party?.mobile, party?.address].filter(Boolean).join(' · ') || 'Party ledger'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0">
          <button className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 md:flex-none" onClick={() => setPaying('customer')} disabled={!ledger}>
            <HandCoins size={16} /> Receive
          </button>
          <button className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 md:flex-none" onClick={() => setPaying('vendor')} disabled={!ledger}>
            <Send size={16} /> Pay
          </button>
          <button
            type="button"
            onClick={shareOnWhatsApp}
            disabled={!party?.mobile}
            title={party?.mobile ? 'Send the balance and latest entries on WhatsApp' : 'This party has no mobile number'}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Period */}
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
            <StatCard icon={Scale} label={now > 0 ? 'You Receive' : now < 0 ? 'You Pay' : 'Balance'}
              hint={now === 0 ? 'Settled' : 'As of today'} value={fmt(now)} tone={now > 0 ? 'emerald' : now < 0 ? 'rose' : 'indigo'} />
            <StatCard icon={ArrowUpRight} label="Sales" hint={ledger.bricksSold ? `${ledger.bricksSold.toLocaleString('en-IN')} bricks · ${periodText}` : periodText}
              value={fmt(ledger.sales)} tone="amber" />
            <StatCard icon={ShoppingCart} label="Purchases" hint="Bought from them, incl. vehicle hire" value={fmt(ledger.purchases)} tone="blue" />
            <StatCard icon={ArrowDownLeft} label="Received" hint={`Paid out ${fmt(ledger.paid)}`} value={fmt(ledger.received)} tone="indigo" />
          </section>

          <section className="panel">
            <div className="panel-header flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Ledger</h2>
              <span className="text-xs text-slate-500">
                {rows.length} {rows.length === 1 ? 'entry' : 'entries'} · newest first · Dr = they owe you, Cr = you owe them
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Inbox size={20} /></span>
                <p className="text-sm font-semibold text-slate-800">No entries {range ? 'in this period' : 'yet'}</p>
              </div>
            ) : (
              <>
                {/* Phone: three short lines per entry */}
                <ul className="divide-y divide-slate-100 md:hidden">
                  {rows.map((r, i) => (
                    <li key={`${r.type}-${r.refId}-${i}`} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={TYPE_BADGES[r.type]}>{r.label}</span>
                        <span className="text-sm font-bold text-slate-900">{fmt(r.amount)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span className="min-w-0 truncate">
                          {[dayjs(r.date).format('DD MMM YYYY'), r.refNumber, r.item, r.vehicle].filter(Boolean).join(' · ')}
                        </span>
                        <span className={`shrink-0 font-semibold ${balanceTone(r.balance)}`}>{drCr(r.balance)}</span>
                      </div>
                      {hasPaid(r) && (
                        <p className="text-[11px] text-slate-400">
                          Paid {fmt(r.paidAmount)}{r.debit - r.credit !== 0 ? ` · due ${fmt(r.debit - r.credit)}` : ''}
                        </p>
                      )}
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 text-xs">
                    <span className="font-semibold text-slate-700">Opening balance</span>
                    <span className={`font-semibold ${balanceTone(ledger.opening)}`}>{drCr(ledger.opening)}</span>
                  </li>
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">Type</th>
                        <th className="table-header">Item / Vehicle</th>
                        <th className="table-header text-right">Quantity</th>
                        <th className="table-header text-right">Amount</th>
                        <th className="table-header text-right">Paid</th>
                        <th className="table-header text-right">Due</th>
                        <th className="table-header text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const due = r.debit - r.credit;
                        return (
                          <tr key={`${r.type}-${r.refId}-${i}`} className="table-row">
                            <td className="table-cell whitespace-nowrap">
                              <p className="font-semibold text-slate-800">{dayjs(r.date).format('DD MMM YYYY')}</p>
                              {r.refNumber && <p className="text-[11px] leading-tight text-slate-400">{r.refNumber}</p>}
                            </td>
                            <td className="table-cell"><span className={TYPE_BADGES[r.type]}>{r.label}</span></td>
                            <td className="table-cell">
                              <p className="font-medium text-slate-800">{r.item || '—'}</p>
                              {(r.vehicle || r.note) && <p className="text-[11px] text-slate-500">{[r.vehicle, r.note].filter(Boolean).join(' · ')}</p>}
                            </td>
                            <td className="table-cell whitespace-nowrap text-right text-slate-600">{r.quantity || '—'}</td>
                            <td className="table-cell whitespace-nowrap text-right font-semibold text-slate-900">{fmt(r.amount)}</td>
                            <td className="table-cell whitespace-nowrap text-right text-emerald-700">{hasPaid(r) ? fmt(r.paidAmount) : '—'}</td>
                            <td className={`table-cell whitespace-nowrap text-right ${hasPaid(r) && due !== 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                              {hasPaid(r) ? fmt(due) : '—'}
                            </td>
                            <td className={`table-cell whitespace-nowrap text-right font-bold ${balanceTone(r.balance)}`}>{drCr(r.balance)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50/60">
                        <td className="table-cell whitespace-nowrap text-slate-400">{range ? dayjs(range.from).format('DD MMM YYYY') : '—'}</td>
                        <td className="table-cell" colSpan={6}>
                          <p className="font-semibold text-slate-800">Opening balance</p>
                          <p className="text-xs text-slate-500">{range ? 'Balance carried forward from before this period' : 'Opening balance saved on the party'}</p>
                        </td>
                        <td className={`table-cell whitespace-nowrap text-right font-bold ${balanceTone(ledger.opening)}`}>{drCr(ledger.opening)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
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
