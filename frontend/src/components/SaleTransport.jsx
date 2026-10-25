import { useState } from 'react';
import { NON_NEGATIVE } from '../lib/number';
import OptionPicker from './OptionPicker';
import { defaultPlantId } from '../lib/plants';
import { TRANSPORT_MODES, TRANSPORT_BASES, basisOf, transportCost, saleTransportQty, cleanVehicleNumber } from '../lib/transport';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Transport on a sale: whose vehicle carried it, and for a hired
 * vehicle who it is hired from and what they are paid. A per-trip delivery goes from the sale's plant
 * to a place typed in; a saved route of the vehicle fills in the transporter's per-trip charge.
 * Props: form (the invoice form), onChange(patch), vehicles, parties, plants, pieces (bricks on the sale)
 */
export default function SaleTransport({ form, onChange, vehicles, parties, plants, pieces }) {
  const mode = form.transportMode || 'party';
  const basis = basisOf(form.transportBasis);
  const qty = saleTransportQty(form, pieces);
  const cost = mode === 'hired' ? transportCost(form.transportBasis, qty, form.transportRate) : 0;

  // Routes of the chosen vehicle that start at this sale's plant
  const mainPlant = defaultPlantId(plants);
  const salePlant = form.plant || mainPlant;
  const plantName = plants.find(p => p._id === salePlant)?.name || 'Plant';
  const vehicle = vehicles.find(v => v.vehicleNumber === cleanVehicleNumber(form.vehicleNumber));
  const routesFor = (v) => (v?.tripRates || []).filter(r => (r.plant || mainPlant) === salePlant);
  const routes = routesFor(vehicle);
  const perTrip = mode === 'own' || (mode === 'hired' && basis.key === 'per_trip');

  // A route sets where it went and what the transporter is paid per trip
  const routePatch = (r, ownership) => ({
    transportLocation: r.location,
    ...(ownership === 'hired' ? { transportBasis: 'per_trip', transportRate: r.rate || '' } : {}),
  });

  // Typing or picking a known vehicle fills in its transport, and its route when it has only one
  const pickVehicle = (value) => {
    const number = cleanVehicleNumber(value);
    const v = vehicles.find(x => x.vehicleNumber === number);
    if (!v) return onChange({ vehicleNumber: number });
    const only = routesFor(v).length === 1 ? routesFor(v)[0] : null;
    onChange({
      vehicleNumber: v.vehicleNumber,
      transportMode: v.ownership,
      transportLocation: '',
      ...(v.ownership === 'hired' ? { transporter: v.party || '', transportBasis: v.hireBasis || 'per_trip', transportRate: v.hireRate || '' } : {}),
      ...(only && (v.ownership === 'own' || (v.hireBasis || 'per_trip') === 'per_trip') ? routePatch(only, v.ownership) : {}),
    });
  };

  // My vehicles and hired vehicles are picked from a list of that kind; a new number can still be typed
  const [typingNew, setTypingNew] = useState(false);
  const kindVehicles = vehicles.filter(v => v.ownership === mode && v.isActive !== false);
  const vehicleOptions = kindVehicles.map(v => ({
    value: v.vehicleNumber,
    label: v.vehicleNumber,
    hint: mode === 'hired' ? parties.find(p => p._id === v.party)?.name : undefined,
  }));
  // A number already on this sale stays pickable even when it is not in the list
  if (form.vehicleNumber && !vehicleOptions.some(o => o.value === form.vehicleNumber)) {
    vehicleOptions.unshift({ value: form.vehicleNumber, label: form.vehicleNumber });
  }
  const showPicker = mode !== 'party' && !typingNew && kindVehicles.length > 0;

  const pickMode = (key) => {
    setTypingNew(false);
    // A vehicle of another kind does not carry over
    const keep = vehicle && vehicle.ownership === key;
    onChange({ transportMode: key, ...(keep ? {} : { vehicleNumber: '', transportLocation: '' }) });
  };

  const pickRoute = (location) => {
    const r = routes.find(x => x.location === location);
    onChange(r ? routePatch(r, mode) : { transportLocation: location });
  };

  const hasQty = mode === 'hired' && !['per_trip', 'fixed'].includes(basis.key);
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TRANSPORT_MODES.map(m => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => pickMode(m.key)}
              className={`rounded-lg border-2 px-2 py-2 text-center transition sm:px-3 sm:text-left ${active ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span className={`block text-xs font-semibold sm:text-sm ${active ? 'text-amber-800' : 'text-slate-700'}`}>{m.label}</span>
              <span className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">{m.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <div className={mode === 'hired' ? 'col-span-2 md:col-span-1' : 'col-span-2'}>
          <div className="mb-1 flex min-h-[1.25rem] items-center justify-between gap-2">
            <label className="label mb-0">Vehicle No.</label>
            {mode !== 'party' && kindVehicles.length > 0 && (
              <button type="button" className="text-xs font-semibold text-primary-600 hover:underline"
                onClick={() => { setTypingNew(!typingNew); onChange({ vehicleNumber: '', transportLocation: '' }); }}>
                {typingNew ? 'Pick from list' : '+ New Vehicle'}
              </button>
            )}
          </div>
          {showPicker ? (
            <OptionPicker options={vehicleOptions} value={form.vehicleNumber} onChange={pickVehicle}
              placeholder={mode === 'own' ? 'Select my vehicle' : 'Select hired vehicle'} searchPlaceholder="Search vehicle number..." />
          ) : (
            <>
              <input className="input uppercase placeholder:normal-case" list={mode === 'party' ? 'sale-vehicles' : undefined}
                placeholder={mode === 'party' ? "Party's vehicle, e.g. MH04AB1234" : 'New vehicle number, e.g. MH04AB1234'}
                value={form.vehicleNumber} onChange={e => pickVehicle(e.target.value)} />
              {mode === 'party' && (
                <datalist id="sale-vehicles">
                  {vehicles.filter(v => v.ownership === 'party' && v.isActive !== false).map(v => <option key={v._id} value={v.vehicleNumber} />)}
                </datalist>
              )}
              {mode !== 'party' && <p className="mt-1 text-[11px] text-slate-500">Saved to your vehicles when the sale is saved.</p>}
            </>
          )}
        </div>
        {mode === 'hired' && <>
          <div className="col-span-2 md:col-span-1">
            {/* Same height as the vehicle's label row, which has a button */}
            <div className="mb-1 flex min-h-[1.25rem] items-center"><label className="label mb-0">Transporter</label></div>
            <select className="input" value={form.transporter} onChange={e => onChange({ transporter: e.target.value })}>
              <option value="">Select Transporter</option>
              {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="mb-1 flex min-h-[1.25rem] items-center"><label className="label mb-0">Pay Transporter</label></div>
            <select className="input" value={form.transportBasis} onChange={e => onChange({ transportBasis: e.target.value })}>
              {TRANSPORT_BASES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
        </>}
      </div>

      {/* Row 2 (hired, not per trip): how much the transporter is paid; per trip is asked with From / To below */}
      {mode === 'hired' && basis.key !== 'per_trip' && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {!['per_trip', 'fixed'].includes(basis.key) && (
            <div>
              <label className="label">{basis.key === 'per_km' ? 'Distance (km)' : basis.key === 'per_ton' ? 'Weight (tons)' : 'Bricks (×1000)'}</label>
              {basis.key === 'per_1000' ? (
                <input className="input bg-slate-50 font-semibold" readOnly value={qty} title="From the bricks on this sale" />
              ) : (
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0"
                  value={form.transportQty} onChange={e => onChange({ transportQty: e.target.value })} />
              )}
            </div>
          )}
          <div className={hasQty ? '' : 'col-span-2 md:col-span-1'}>
            <label className="label">{basis.key === 'fixed' ? 'Amount to Transporter (₹)' : `Rate (₹ / ${basis.unit})`}</label>
            <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0"
              value={form.transportRate} onChange={e => onChange({ transportRate: e.target.value })} />
          </div>
        </div>
      )}

      {/* Per trip: from this sale's plant (location A) to a place typed in (location B), and what the transporter is paid */}
      {perTrip && (
        <div className={`grid grid-cols-2 gap-3 md:gap-4 ${mode === 'hired' ? 'md:grid-cols-3' : ''}`}>
          <div>
            <label className="label">From (Location A)</label>
            <p className="input truncate bg-slate-50 font-semibold text-slate-700" title="The plant this sale is from">{plantName}</p>
          </div>
          <div>
            <label className="label">To (Location B)</label>
            {/* Saved routes of the vehicle are suggested; picking one fills in its transporter charge */}
            <input className="input" list="sale-routes" placeholder="e.g. Raipur"
              value={form.transportLocation || ''} onChange={e => pickRoute(e.target.value)} />
            <datalist id="sale-routes">
              {routes.map(r => <option key={r.location} value={r.location} />)}
            </datalist>
          </div>
          {mode === 'hired' && (
            <div className="col-span-2 md:col-span-1">
              <label className="label">Transporter Charge (₹ / trip)</label>
              <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0"
                value={form.transportRate} onChange={e => onChange({ transportRate: e.target.value })} />
            </div>
          )}
        </div>
      )}

      {mode !== 'own' && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-inset ring-amber-200">
          {mode === 'party' ? (
            <span className="text-slate-600">The party takes the bricks in their own vehicle.</span>
          ) : (
            <span className="text-slate-600">You pay transporter: <span className="font-bold text-rose-600">{fmt(cost)}</span></span>
          )}
        </div>
      )}
    </div>
  );
}
