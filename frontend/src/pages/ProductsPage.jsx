import CRUDPage from '../components/CRUDPage';

export default function ProductsPage() {
  return (
    <CRUDPage
      title="Brick Types"
      subtitle="Define the brick types you manufacture"
      endpoint="/products"
      columns={[
        { key: 'name', label: 'Brick Name' },
        { key: 'size', label: 'Size Label' },
        { key: 'labourRatePerBrick', label: 'Labour / Brick', render: r => r.labourRatePerBrick ? `₹${r.labourRatePerBrick}` : '-' },
        { key: 'openingStock', label: 'Opening Stock', render: r => r.openingStock ? `${r.openingStock.toLocaleString('en-IN')} pcs` : '-' },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Brick Name', placeholder: 'e.g. 9 Inch Brick' },
        { key: 'size', label: 'Size Label', placeholder: 'e.g. 9 x 4 x 3 inch' },
        { key: 'labourRatePerBrick', label: 'Labour Commission per Brick (₹)', type: 'number', step: '0.01', placeholder: 'e.g. 0.5 for 8 inch, 0.6 for 9 inch' },
        { key: 'openingStock', label: 'Opening Stock (pcs)', type: 'number', placeholder: 'Bricks already in hand, e.g. 10000' },
      ]}
      defaultValues={{ name: '', size: '', labourRatePerBrick: '', openingStock: '' }}
    />
  );
}
