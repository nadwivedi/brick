import { NON_NEGATIVE } from '../lib/number';
import { TRANSPORT_MODES, TRANSPORT_BASES, basisOf, transportCost, saleTransportQty } from '../lib/transport';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Transport on a sale: whose vehicle carried it, what the party is charged, and for a hired
 * vehicle who it is hired from and what they are paid.
 * Props: form (the invoice form), onChange(patch), vehicles, parties, pieces (bricks on the sale)
 */
export default function SaleTransport({ form, onChange, vehicles, parties, pieces }) {
  const mode = form.transportMode || 'party';
  const basis = basisOf(form.transportBasis);
  const qty = saleTransportQty(form, pieces);
  const cost = mode === 'hired' ? transportCost(form.transportBasis, qty, form.transportRate) : 0;
  const charge = Number(form.transportCharges) || 0;

  // Typing or picking a known vehicle fills in its transport
  const pickVehicle = (value) => {
    const v = vehicles.find(x => x.vehicleNumber === value.trim().toUpperCase());
    if (!v) return onChange({ vehicleNumber: value });
    onChange({
      vehicleNumber: v.vehicleNumber,
      transportMode: v.ownership,
      ...(v.ownership === 'hired' ? { transporter: v.party || '', transportBasis: v.hireBasis || 'per_trip', transportRate: v.hireRate || '' } : {}),
    });
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TRANSPORT_MODES.map(m => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onChange({ transportMode: m.key })}
              className={`rounded-lg border-2 px-2 py-2 text-center transition sm:px-3 sm:text-left ${active ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span className={`block text-xs font-semibold sm:text-sm ${active ? 'text-amber-800' : 'text-slate-700'}`}>{m.label}</span>
              <span className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">{m.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="col-span-2">
          <label className="label">Vehicle Number</label>
          <input className="input uppercase placeholder:normal-case" list="sale-vehicles" placeholder="Type or pick, e.g. MH 04 AB 1234"
            value={form.vehicleNumber} onChange={e => pickVehicle(e.target.value)} />
          <datalist id="sale-vehicles">
            {vehicles.filter(v => v.isActive !== false).map(v => <option key={v._id} value={v.vehicleNumber} />)}
          </datalist>
        </div>
        {mode !== 'party' && (
          <div className="col-span-2">
            <label className="label">Transport Charge to Party (₹)</label>
            <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0 = free delivery"
              value={form.transportCharges || ''} onChange={e => onChange({ transportCharges: e.target.value })} />
          </div>
        )}
      </div>

      {mode === 'hired' && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Transporter</label>
            <select className="input" value={form.transporter} onChange={e => onChange({ transporter: e.target.value })}>
              <option value="">Select Party</option>
              {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Pay Transporter</label>
            <select className="input" value={form.transportBasis} onChange={e => onChange({ transportBasis: e.target.value })}>
              {TRANSPORT_BASES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          {basis.key !== 'fixed' && (
            <div>
              <label className="label">{basis.key === 'per_trip' ? 'Trips' : basis.key === 'per_km' ? 'Distance (km)' : basis.key === 'per_ton' ? 'Weight (tons)' : 'Bricks (×1000)'}</label>
              {basis.key === 'per_1000' ? (
                <input className="input bg-slate-50 font-semibold" readOnly value={qty} title="From the bricks on this sale" />
              ) : (
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder={basis.key === 'per_trip' ? '1' : '0'}
                  value={form.transportQty} onChange={e => onChange({ transportQty: e.target.value })} />
              )}
            </div>
          )}
          <div className={basis.key === 'fixed' ? 'col-span-2' : ''}>
            <label className="label">{basis.key === 'fixed' ? 'Amount to Transporter (₹)' : `Rate (₹ / ${basis.unit})`}</label>
            <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0"
              value={form.transportRate} onChange={e => onChange({ transportRate: e.target.value })} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-inset ring-amber-200">
        {mode === 'party' ? (
          <span className="text-slate-600">The party takes the bricks in their own vehicle, so there is no transport charge.</span>
        ) : (
          <>
            <span className="text-slate-600">Charged to party: <span className="font-bold text-slate-900">{fmt(charge)}</span></span>
            {mode === 'hired' && <>
              <span className="text-slate-600">You pay transporter: <span className="font-bold text-rose-600">{fmt(cost)}</span></span>
              <span className="text-slate-600">Margin: <span className={`font-bold ${charge - cost < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{fmt(charge - cost)}</span></span>
            </>}
          </>
        )}
      </div>
    </div>
  );
}
