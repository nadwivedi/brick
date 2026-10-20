import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import { defaultPlantId, hasManyPlants, pickablePlants } from '../lib/plants';

/**
 * Per-trip routes of a vehicle: from a plant to a location, what the transporter is paid per trip
 * (hired vehicles only) and what the party is charged per trip.
 * Props: value (rows), onChange(rows), plants, hired
 */
export default function TripRatesEditor({ value, onChange, plants, hired }) {
  const rows = value || [];
  const manyPlants = hasManyPlants(plants);
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { plant: defaultPlantId(plants), location: '', rate: '', charge: '' }]);
  const plantName = (id) => plants.find(p => p._id === id)?.name || plants.find(p => p._id === defaultPlantId(plants))?.name || 'Plant';

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500">
          No routes yet. Add where this vehicle goes and the per-trip rate, then pick the route on a sale.
        </p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">From</p>
              {manyPlants ? (
                <select className="input py-1.5" value={r.plant || ''} onChange={e => set(i, { plant: e.target.value })}>
                  {pickablePlants(plants, r.plant).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              ) : (
                <p className="truncate rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">{plantName(r.plant)}</p>
              )}
            </div>
            <ArrowRight size={16} className="mb-2.5 text-slate-400" />
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">To</p>
              <input className="input py-1.5" placeholder="Location, e.g. Raipur" value={r.location} onChange={e => set(i, { location: e.target.value })} />
            </div>
            <button type="button" className="icon-btn mb-0.5 hover:bg-red-50 hover:text-red-600" title="Remove route" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
              <Trash2 size={15} />
            </button>
          </div>
          <div className={`mt-2 grid gap-2 ${hired ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {hired && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Transporter charges / trip</p>
                <input type="number" {...NON_NEGATIVE} className="input py-1.5 font-semibold text-rose-600" placeholder="₹ we pay" value={r.rate} onChange={e => set(i, { rate: e.target.value })} />
              </div>
            )}
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">We charge party / trip</p>
              <input type="number" {...NON_NEGATIVE} className="input py-1.5 font-semibold text-emerald-700" placeholder="₹ party pays" value={r.charge} onChange={e => set(i, { charge: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary btn-sm" onClick={add}><Plus size={14} /> Add Route</button>
    </div>
  );
}
