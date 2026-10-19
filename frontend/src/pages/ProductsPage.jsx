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
        { key: 'openingStock', label: 'Opening Stock', render: r => r.openingStock ? `${r.openingStock.toLocaleString('en-IN')} pcs` : '-' },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Brick Name', placeholder: 'e.g. 9 Inch Brick' },
        { key: 'size', label: 'Size Label', placeholder: 'e.g. 9 x 4 x 3 inch' },
        { key: 'openingStock', label: 'Opening Stock (pcs)', type: 'number', placeholder: 'Bricks already in hand, e.g. 10000' },
      ]}
      defaultValues={{ name: '', size: '', openingStock: '' }}
    />
  );
}
