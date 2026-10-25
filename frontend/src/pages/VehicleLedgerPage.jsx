import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { ChevronLeft, Truck, Layers, Wallet, Route, BookOpen, Inbox } from 'lucide-react';
import { modeLabel } from '../lib/transport';
import dayjs from 'dayjs';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const num = (n) => (n || 0).toLocaleString('en-IN');

const DATE_FMT = 'YYYY-MM-DD';
const RANGES = [
  { key: 'all', label: 'All Time', get: () => null },
  { key: 'last7', label: '7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: '30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'month', label: 'This Month', get: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'year', label: '1 Year', get: () => [dayjs().subtract(1, 'year').add(1, 'day'), dayjs()] },
  { key: 'custom', label: 'Custom' },
];

const OWNERSHIP_BADGES = { party: 'badge-gray', own: 'badge-blue', hired: 'badge-orange' };

/** Ledger of one vehicle: every sale it carried, newest first, and for a hired one when, from whom and at what rate. */
export default function VehicleLedgerPage() {
  const { id } = useParams();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState(null); // null = all time, else { from, to }
  const [custom, setCustom] = useState({ from: dayjs().startOf('month').format(DATE_FMT), to: dayjs().format(DATE_FMT) });

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/vehicles/${id}/ledger`, { params: range || {} })
      .then(res => setLedger(res.data))
      .catch(e => { setLedger(null); setError(e.message || 'Could not load the ledger'); })
      .finally(() => setLoading(false));
  }, [id, range]);

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

  const v = ledger?.vehicle;
  const hired = v?.ownership === 'hired';
  const rows = ledger ? [...ledger.entries].reverse() : []; // newest first
  // Sales it went on hired (a vehicle can be picked as hired on some sales and not others)
  const hiredTrips = rows.filter(r => r.mode === 'hired').length;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/masters/vehicles" className="icon-btn shrink-0 bg-white ring-1 ring-slate-200" title="Back to Vehicles" aria-label="Back to Vehicles">
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title flex flex-wrap items-center gap-2">
              <span className="truncate tracking-wide">{v?.vehicleNumber || 'Vehicle Ledger'}</span>
              {v && <span className={OWNERSHIP_BADGES[v.ownership] || 'badge-gray'}>{modeLabel(v.ownership)}</span>}
            </h1>
            <p className="page-subtitle truncate">
              {hired ? `Hired from ${v.transporter || '—'} · ` : v?.ownership === 'own' ? 'My vehicle · ' : ''}Every sale this vehicle carried · {periodText}
            </p>
          </div>
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
            <StatCard icon={Truck} label="Trips" hint={periodText} value={num(ledger.trips)} tone="blue" />
            <StatCard icon={Layers} label="Bricks Carried" hint={ledger.trips ? `${num(Math.round(ledger.bricks / ledger.trips))} per trip on average` : 'No trips'} value={`${num(ledger.bricks)} pcs`} tone="emerald" />
            <StatCard icon={Wallet} label="Hire Cost" hint={hiredTrips ? `Paid to transporter for ${num(hiredTrips)} ${hiredTrips === 1 ? 'trip' : 'trips'}` : 'No hire cost'} value={fmt(ledger.cost)} tone="rose" />
            <StatCard icon={Route} label="Avg Cost / Trip" hint={hiredTrips ? 'Hired trips only' : 'No hired trips'} value={hiredTrips ? fmt(ledger.cost / hiredTrips) : '—'} tone="amber" />
          </section>

          <section className="panel">
            <div className="panel-header flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Ledger</h2>
              <span className="text-xs text-slate-500">{rows.length} {rows.length === 1 ? 'trip' : 'trips'} · newest first</span>
            </div>

            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Inbox size={20} /></span>
                <p className="text-sm font-semibold text-slate-800">No trips {range ? 'in this period' : 'yet'}</p>
                <p className="text-xs text-slate-500">Trips show here when this vehicle is picked on a sale.</p>
              </div>
            ) : (
              <>
                {/* Phone: short lines per trip */}
                <ul className="divide-y divide-slate-100 md:hidden">
                  {rows.map(r => (
                    <li key={r._id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{r.party || '—'}</span>
                        <span className="shrink-0 text-sm font-bold text-rose-600">{r.mode === 'hired' ? fmt(r.cost) : ''}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {[dayjs(r.date).format('DD MMM YYYY'), r.invoiceNumber, r.location ? `${r.plant || 'Plant'} → ${r.location}` : '', `${num(r.bricks)} pcs`].filter(Boolean).join(' · ')}
                      </p>
                      {r.mode === 'hired' && <p className="text-[11px] text-slate-400">{[r.transporter, r.rateText].filter(Boolean).join(' · ')}</p>}
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[860px] text-left">
                    <thead>
                      <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">Party</th>
                        <th className="table-header">Route</th>
                        <th className="table-header text-right">Bricks</th>
                        <th className="table-header">Hired From</th>
                        <th className="table-header">Rate</th>
                        <th className="table-header text-right">Hire Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r._id} className="table-row">
                          <td className="table-cell whitespace-nowrap">
                            <p className="font-semibold text-slate-800">{dayjs(r.date).format('DD MMM YYYY')}</p>
                            <p className="text-[11px] leading-tight text-slate-400">{r.invoiceNumber}</p>
                          </td>
                          <td className="table-cell font-medium text-slate-800">{r.party || '—'}</td>
                          <td className="table-cell text-slate-600">{r.location ? `${r.plant || 'Plant'} → ${r.location}` : '—'}</td>
                          <td className="table-cell whitespace-nowrap text-right text-slate-700">{num(r.bricks)}</td>
                          <td className="table-cell text-slate-700">{r.mode === 'hired' ? r.transporter || '—' : <span className="text-slate-400">{modeLabel(r.mode)}</span>}</td>
                          <td className="table-cell whitespace-nowrap text-slate-600">{r.rateText || '—'}</td>
                          <td className="table-cell whitespace-nowrap text-right font-semibold text-rose-600">{r.mode === 'hired' ? fmt(r.cost) : '—'}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold">
                        <td className="table-cell text-slate-800" colSpan={3}>Total · {num(ledger.trips)} {ledger.trips === 1 ? 'trip' : 'trips'}</td>
                        <td className="table-cell whitespace-nowrap text-right text-slate-800">{num(ledger.bricks)}</td>
                        <td className="table-cell" colSpan={2} />
                        <td className="table-cell whitespace-nowrap text-right text-rose-600">{fmt(ledger.cost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
