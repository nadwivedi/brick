import CRUDPage from '../components/CRUDPage';

export default function VendorsPage() {
  return (
    <CRUDPage
      title="Vendors"
      subtitle="Manage your raw material suppliers"
      endpoint="/vendors"
      columns={[
        { key: 'name', label: 'Vendor Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'address', label: 'Address' },
        { key: 'materials', label: 'Supplies', render: r => Array.isArray(r.materials) ? r.materials.join(', ') || '-' : '-' },
        { key: 'openingBalance', label: 'Balance Due', render: r => `₹${(r.openingBalance || 0).toLocaleString('en-IN')}` },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Vendor Name' },
        { key: 'mobile', label: 'Mobile', type: 'tel' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'openingBalance', label: 'Opening Balance (₹)', type: 'number', placeholder: '0' },
      ]}
      defaultValues={{ name: '', mobile: '', address: '', gstin: '', openingBalance: 0, isActive: true }}
    />
  );
}
