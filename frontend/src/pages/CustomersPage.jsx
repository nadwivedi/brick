import CRUDPage from '../components/CRUDPage';

export default function CustomersPage() {
  return (
    <CRUDPage
      title="Customers"
      subtitle="Manage your brick buyers and their credit details"
      endpoint="/customers"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'address', label: 'Address' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'openingBalance', label: 'Opening Balance', render: r => r.openingBalance ? `₹${r.openingBalance.toLocaleString('en-IN')}` : '₹0' },
        { key: 'creditLimit', label: 'Credit Limit', render: r => r.creditLimit ? `₹${r.creditLimit.toLocaleString('en-IN')}` : 'No limit' },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Customer Name', placeholder: 'Full name' },
        { key: 'mobile', label: 'Mobile Number', type: 'tel' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'gstin', label: 'GSTIN (Optional)' },
        { key: 'openingBalance', label: 'Opening Balance (₹)', type: 'number', placeholder: '0' },
        { key: 'creditLimit', label: 'Credit Limit (₹)', type: 'number', placeholder: '0' },
        {
          key: 'isActive', label: 'Status', type: 'select', options: [
            { value: true, label: 'Active' }, { value: false, label: 'Inactive' }
          ]
        },
      ]}
      defaultValues={{ name: '', mobile: '', address: '', gstin: '', openingBalance: 0, creditLimit: 0, isActive: true }}
    />
  );
}
