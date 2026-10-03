import CRUDPage from '../components/CRUDPage';

export default function WorkersPage() {
  return (
    <CRUDPage
      title="Labour / Workers"
      subtitle="Manage brick plant workers and their wage types"
      endpoint="/workers"
      columns={[
        { key: 'name', label: 'Worker Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'type', label: 'Type', render: r => <span className="badge-orange capitalize">{r.type?.replace('_', ' ')}</span> },
        { key: 'rate', label: 'Rate', render: r => {
          const unit = r.type === 'piece_rate' ? '/1000 bricks' : r.type === 'daily_wage' ? '/day' : '/month';
          return `₹${(r.rate || 0).toLocaleString('en-IN')} ${unit}`;
        }},
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Worker Name' },
        { key: 'mobile', label: 'Mobile', type: 'tel' },
        { key: 'address', label: 'Address', type: 'textarea' },
        {
          key: 'type', label: 'Wage Type', type: 'select', options: [
            { value: 'piece_rate', label: 'Piece Rate (per 1000 bricks)' },
            { value: 'daily_wage', label: 'Daily Wage' },
            { value: 'monthly', label: 'Monthly Salary' },
          ]
        },
        { key: 'rate', label: 'Rate (₹)', type: 'number' },
      ]}
      defaultValues={{ name: '', mobile: '', address: '', type: 'piece_rate', rate: 0 }}
    />
  );
}
