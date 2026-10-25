import { useState } from 'react';
import { NON_NEGATIVE } from '../lib/number';
import OptionPicker from './OptionPicker';
import { UserRound, Truck, Handshake, MapPin, ArrowRight, Factory } from 'lucide-react';
import { defaultPlantId } from '../lib/plants';
import { TRANSPORT_MODES, TRANSPORT_BASES, basisOf, transportCost, saleTransportQty, cleanVehicleNumber } from '../lib/transport';

// Colour and icon for each kind of vehicle (same colours as the Vehicles list)
const MODE_LOOK = {
  party: { icon: UserRound, active: 'border-slate-500 bg-slate-50', tile: 'bg-slate-600 text-white', text: 'text-slate-800' },
  own: { icon: Truck, active: 'border-blue-500 bg-blue-50', tile: 'bg-blue-600 text-white', text: 'text-blue-800' },
  hired: { icon: Handshake, active: 'border-orange-500 bg-orange-50', tile: 'bg-orange-500 text-white', text: 'text-orange-800' },
};

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
  const showRoute = mode === 'party' || perTrip;
  // Party vehicle comes from a place to the plant; my and hired vehicles go from the plant to a place
  const plantBox = (
    <p className="input flex items-center gap-2 truncate bg-slate-50 font-semibold text-slate-700" title="The plant this sale is from">
      <Factory size={15} className="shrink-0 text-slate-400" /> <span className="truncate">{plantName}</span>
    </p>
  );
  const placeBox = mode === 'party' ? (
    <input className="input" placeholder="Where the vehicle comes from"
      value={form.transportLocation || ''} onChange={e => onChange({ transportLocation: e.target.value })} />
  ) : (
    <>
      {/* Saved routes of the vehicle are suggested; picking one fills in its transporter charge */}
      <input className="input" list="sale-routes" placeholder="e.g. Raipur"
        value={form.transportLocation || ''} onChange={e => pickRoute(e.target.value)} />
      <datalist id="sale-routes">
        {routes.map(r => <option key={r.location} value={r.location} />)}
      </datalist>
    </>
  );
  const [fromBox, toBox] = mode === 'party' ? [placeBox, plantBox] : [plantBox, placeBox];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Whose vehicle: each kind has its own colour and icon */}
      <div className="grid grid-cols-3 gap-2">
        {TRANSPORT_MODES.map(m => {
          const active = mode === m.key;
          const look = MODE_LOOK[m.key];
          const Icon = look.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => pickMode(m.key)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-center transition sm:flex-row sm:gap-2.5 sm:px-3 sm:text-left ${active ? look.active : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? look.tile : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className={`block text-xs font-semibold sm:text-sm ${active ? look.text : 'text-slate-700'}`}>{m.label}</span>
                <span className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">{m.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Vehicle (and, for a hired one, who it is from and how they are paid) */}
      <div className="rounded-xl bg-white p-3 ring-1 ring-inset ring-slate-200 md:p-4">
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
                <input className="input font-semibold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal" list={mode === 'party' ? 'sale-vehicles' : undefined}
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

          {/* Hired, not per trip: how much the transporter is paid; per trip is asked with the route */}
          {mode === 'hired' && hasQty && (
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
          {mode === 'hired' && basis.key !== 'per_trip' && (
            <div className={hasQty ? '' : 'col-span-2 md:col-span-1'}>
              <label className="label">{basis.key === 'fixed' ? 'Amount to Transporter (₹)' : `Rate (₹ / ${basis.unit})`}</label>
              <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0"
                value={form.transportRate} onChange={e => onChange({ transportRate: e.target.value })} />
            </div>
          )}
        </div>
      </div>

      {/* Route: From (A) → To (B), and for a hired per-trip vehicle what the transporter is paid */}
      {showRoute && (
        <div className="rounded-xl bg-white p-3 ring-1 ring-inset ring-slate-200 md:p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MapPin size={14} className="text-slate-400" /> Route
          </p>
          <div className={`grid grid-cols-1 items-end gap-3 md:gap-4 ${mode === 'hired' ? 'sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)]' : 'sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'}`}>
            <div>
              <label className="label flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> From (Location A)</label>
              {fromBox}
            </div>
            <ArrowRight size={18} className="mb-3 hidden text-slate-300 sm:block" />
            <div>
              <label className="label flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> To (Location B)</label>
              {toBox}
            </div>
            {mode === 'hired' && (
              <div className="sm:col-span-3 md:col-span-1">
                <label className="label">Transporter Charge (₹ / trip)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                  <input type="number" {...NON_NEGATIVE} className="input pl-7 font-semibold" placeholder="0"
                    value={form.transportRate} onChange={e => onChange({ transportRate: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'hired' && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-orange-50 px-3 py-2.5 ring-1 ring-inset ring-orange-200 md:px-4">
          <span className="text-sm font-medium text-orange-800">You pay transporter</span>
          <span className="text-lg font-bold text-orange-700">{fmt(cost)}</span>
        </div>
      )}
    </div>
  );
}
