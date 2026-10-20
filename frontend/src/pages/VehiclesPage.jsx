import { useEffect, useState } from 'react';
import api from '../lib/api';
import CRUDPage from '../components/CRUDPage';
import { TRANSPORT_MODES, TRANSPORT_BASES, modeLabel, basisOf } from '../lib/transport';

const OWNERSHIP_BADGES = { party: 'badge-gray', own: 'badge-blue', hired: 'badge-orange' };

export default function VehiclesPage() {
  const [parties, setParties] = useState([]);

  useEffect(() => {
    api.get('/parties').then(res => setParties((res.data || []).sort((a, b) => a.name.localeCompare(b.name)))).catch(console.error);
  }, []);

  const partyName = (id) => parties.find(p => p._id === id)?.name;
  const partyOptions = parties.map(p => ({ value: p._id, label: p.name }));

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
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive !== false ? 'badge-green' : 'badge-gray'}>{r.isActive !== false ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'vehicleNumber', label: 'Vehicle Number', placeholder: 'e.g. MH 04 AB 1234' },
        // Party vehicles come in from sales; vehicles added here are mine or hired
        { key: 'ownership', label: 'Whose Vehicle', type: 'select', options: TRANSPORT_MODES.filter(m => m.key !== 'party').map(m => ({ value: m.key, label: m.label })) },
        { key: 'party', label: 'Transporter (hired from)', type: 'select', options: partyOptions, show: f => f.ownership === 'hired' },
        { key: 'hireBasis', label: 'Usually Paid', type: 'select', options: TRANSPORT_BASES.map(b => ({ value: b.key, label: b.label })), show: f => f.ownership === 'hired' },
        { key: 'hireRate', label: 'Hire Rate (₹)', type: 'number', show: f => f.ownership === 'hired' },
        { key: 'notes', label: 'Notes', placeholder: 'Optional, e.g. driver name' },
        { key: 'isActive', label: 'Status', type: 'select', options: [{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }] },
      ]}
      defaultValues={{ vehicleNumber: '', ownership: 'own', party: '', hireBasis: 'per_trip', hireRate: 0, notes: '', isActive: true }}
    />
  );
}
