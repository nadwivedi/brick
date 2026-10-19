import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import api from '../lib/api';
import CRUDPage from '../components/CRUDPage';

export default function PlantsPage() {
  const makeDefault = async (plant, refresh) => {
    try {
      await api.put(`/plants/${plant._id}`, { isDefault: true });
      toast.success(`${plant.name} is now the main plant`);
      refresh();
    } catch (e) { toast.error(e.message || 'Could not change the main plant'); }
  };

  return (
    <CRUDPage
      title="Plants"
      subtitle="Your main plant is created from your business name. Add more only if you run more than one plant — plant options then appear on every entry."
      endpoint="/plants"
      columns={[
        { key: 'name', label: 'Plant Name', render: r => (
          <span className="flex items-center gap-2">
            {r.name}
            {r.isDefault && <span className="badge-blue"><Star size={11} className="mr-1" /> Main</span>}
          </span>
        ) },
        { key: 'address', label: 'Address' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Plant Name', placeholder: 'e.g. Main Plant, North Unit' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'mobile', label: 'Contact Mobile', type: 'tel' },
        { key: 'isActive', label: 'Status', type: 'select', options: [{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }] },
      ]}
      defaultValues={{ name: '', address: '', gstin: '', mobile: '', isActive: true }}
      canDelete={r => !r.isDefault}
      rowActions={(r, refresh) => !r.isDefault && r.isActive && (
        <button className="btn-secondary btn-sm mr-1 whitespace-nowrap" onClick={() => makeDefault(r, refresh)}>
          <Star size={14} /> Make Main
        </button>
      )}
    />
  );
}
