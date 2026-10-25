import { useEffect, useState } from 'react';
import api from '../lib/api';
import CRUDPage from '../components/CRUDPage';
import { ModalSection } from '../components/Modal';
import OptionPicker from '../components/OptionPicker';
import TripRatesEditor from '../components/TripRatesEditor';
import { NON_NEGATIVE } from '../lib/number';
import { TRANSPORT_MODES, TRANSPORT_BASES, modeLabel, basisOf, cleanVehicleNumber } from '../lib/transport';

const OWNERSHIP_BADGES = { party: 'badge-gray', own: 'badge-blue', hired: 'badge-orange' };
// Party vehicles come in from sales; vehicles added here are mine or hired
const OWNERSHIPS = TRANSPORT_MODES.filter(m => m.key !== 'party');

export default function VehiclesPage() {
  const [parties, setParties] = useState([]);
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get('/parties').then(res => setParties((res.data || []).sort((a, b) => a.name.localeCompare(b.name)))).catch(console.error);
    api.get('/plants').then(res => setPlants(res.data || [])).catch(console.error);
  }, []);

  const partyName = (id) => parties.find(p => p._id === id)?.name;
  const partyOptions = parties.map(p => ({ value: p._id, label: p.name }));

  // The add / edit popup, in sections like the sale and purchase popups
  const vehicleForm = (form, setForm) => {
    const set = (patch) => setForm(f => ({ ...f, ...patch }));
    const hired = form.ownership === 'hired';
    const basis = form.hireBasis || 'per_trip';
    const showRoutes = form.ownership === 'own' || (hired && basis === 'per_trip');
    let n = 0;
    return (
      <>
        <ModalSection number={++n} title="Vehicle Details" tone="blue">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            <div>
              <label className="label">Vehicle Number <span className="text-rose-500">*</span></label>
              <input className="input font-semibold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal" placeholder="e.g. MH04AB1234"
                value={form.vehicleNumber || ''} onChange={e => set({ vehicleNumber: cleanVehicleNumber(e.target.value) })} />
            </div>
            <div>
              <label className="label">Whose Vehicle</label>
              <select className="input" value={form.ownership || 'own'} onChange={e => set({ ownership: e.target.value })}>
                {OWNERSHIPS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </ModalSection>

        {hired && (
          <ModalSection number={++n} title="Hire Details" tone="amber">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
              <div className={basis === 'per_trip' ? '' : 'sm:col-span-2'}>
                <label className="label">Transporter (hired from)</label>
                <OptionPicker options={partyOptions} value={form.party} onChange={party => set({ party })}
                  placeholder="Select Transporter" searchPlaceholder="Search party name..." />
              </div>
              <div>
                <label className="label">Usually Paid</label>
                <select className="input" value={basis} onChange={e => set({ hireBasis: e.target.value })}>
                  {TRANSPORT_BASES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
                </select>
              </div>
              {basis !== 'per_trip' && (
                <div>
                  <label className="label">{basis === 'fixed' ? 'Fixed Amount' : `Hire Rate (per ${basisOf(basis).unit})`}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                    <input type="number" {...NON_NEGATIVE} className="input pl-7 font-semibold" placeholder="0"
                      value={form.hireRate || ''} onChange={e => set({ hireRate: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
            {basis === 'per_trip' && <p className="mt-2 text-xs text-slate-500">Paid per trip: set the transport charge for each route below.</p>}
          </ModalSection>
        )}

        {showRoutes && (
          <ModalSection number={++n} title="Per-Trip Routes" tone="emerald">
            <TripRatesEditor value={form.tripRates} onChange={tripRates => set({ tripRates })} plants={plants} hired={hired} />
          </ModalSection>
        )}

        <ModalSection number={++n} title="Notes" tone="slate">
          <input className="input" placeholder="Optional, e.g. driver name" value={form.notes || ''} onChange={e => set({ notes: e.target.value })} />
        </ModalSection>
      </>
    );
  };

  return (
    <CRUDPage
      title="Vehicles"
      subtitle="Vehicles that carry your bricks. Picking one on a sale fills in its transport. New numbers typed on a sale are added here."
      endpoint="/vehicles"
      columns={[
        { key: 'vehicleNumber', label: 'Vehicle No.' },
        { key: 'ownership', label: 'Type', render: r => <span className={OWNERSHIP_BADGES[r.ownership] || 'badge-gray'}>{modeLabel(r.ownership)}</span> },
        { key: 'party', label: 'Owner', render: r => (r.ownership === 'own' ? 'Me' : partyName(r.party) || '-') },
        { key: 'hireRate', label: 'Hire Rate', render: r => (r.ownership === 'hired' && r.hireRate
          ? `₹${r.hireRate.toLocaleString('en-IN')} ${r.hireBasis === 'fixed' ? 'fixed' : `/ ${basisOf(r.hireBasis).unit}`}`
          : '-') },
        { key: 'tripRates', label: 'Routes', render: r => {
          const routes = r.tripRates || [];
          if (!routes.length) return '-';
          const first = routes[0];
          return (
            <span title={routes.map(t => r.ownership === 'hired' ? `${t.location}: ₹${t.rate || 0} / trip` : t.location).join(', ')}>
              {first.location}{routes.length > 1 ? ` +${routes.length - 1} more` : ''}
            </span>
          );
        } },
      ]}
      fields={[
        { key: 'vehicleNumber', label: 'Vehicle Number', placeholder: 'e.g. MH04AB1234', clean: cleanVehicleNumber },
        // Party vehicles come in from sales; vehicles added here are mine or hired
        { key: 'ownership', label: 'Whose Vehicle', type: 'select', options: TRANSPORT_MODES.filter(m => m.key !== 'party').map(m => ({ value: m.key, label: m.label })) },
        { key: 'party', label: 'Transporter (hired from)', type: 'select', options: partyOptions, show: f => f.ownership === 'hired' },
        { key: 'hireBasis', label: 'Usually Paid', type: 'select', options: TRANSPORT_BASES.map(b => ({ value: b.key, label: b.label })), show: f => f.ownership === 'hired' },
        { key: 'hireRate', label: 'Hire Rate (₹)', type: 'number', show: f => f.ownership === 'hired' && f.hireBasis !== 'per_trip' },
        {
          key: 'tripRates', label: 'Per-Trip Routes', type: 'custom',
          show: f => f.ownership === 'own' || (f.ownership === 'hired' && f.hireBasis === 'per_trip'),
          render: (rows, set, form) => <TripRatesEditor value={rows} onChange={set} plants={plants} hired={form.ownership === 'hired'} />,
        },
        { key: 'notes', label: 'Notes', placeholder: 'Optional, e.g. driver name' },
      ]}
      formContent={vehicleForm}
      formWidth="max-w-3xl"
      defaultValues={{ vehicleNumber: '', ownership: 'own', party: '', hireBasis: 'per_trip', hireRate: 0, tripRates: [], notes: '' }}
    />
  );
}
