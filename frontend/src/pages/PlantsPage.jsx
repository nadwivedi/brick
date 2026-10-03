import CRUDPage from '../components/CRUDPage';

export default function PlantsPage() {
  return (
    <CRUDPage
      title="Plants"
      subtitle="Manage your brick manufacturing plant locations"
      endpoint="/plants"
      columns={[
        { key: 'name', label: 'Plant Name' },
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
      ]}
      defaultValues={{ name: '', address: '', gstin: '', mobile: '' }}
    />
  );
}
