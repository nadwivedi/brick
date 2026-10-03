import CRUDPage from '../components/CRUDPage';

export default function UnitsPage() {
  return (
    <CRUDPage
      title="Units"
      subtitle="Units of measurement for raw materials (Bag, Ton, KG, Pieces are built in)"
      endpoint="/units"
      columns={[
        { key: 'name', label: 'Unit Name' },
        { key: 'code', label: 'Unit Code' },
        { key: 'isDefault', label: 'Type', render: r => <span className={r.isDefault ? 'badge-gray' : 'badge-orange'}>{r.isDefault ? 'Default' : 'Custom'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Unit Name', placeholder: 'e.g. Litre, Trolley, Brass, Metric Ton' },
        { key: 'code', label: 'Unit Code', placeholder: 'e.g. LTR, TRL, BRS, MT' },
      ]}
      defaultValues={{ name: '', code: '' }}
      canDelete={r => !r.isDefault}
    />
  );
}
