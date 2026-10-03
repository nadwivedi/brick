import { Link } from 'react-router-dom';
import CRUDPage from '../components/CRUDPage';

export default function ExpenseCategoriesPage() {
  return (
    <CRUDPage
      title="Expense Categories"
      subtitle={<>Categories used when recording expenses (Labour, Diesel, Maintenance, Miscellaneous are built in) · <Link to="/expenses" className="font-semibold text-primary-600 hover:underline">Go to expenses</Link></>}
      endpoint="/expense-categories"
      columns={[
        { key: 'name', label: 'Expense Category' },
        { key: 'description', label: 'Description' },
        { key: 'isDefault', label: 'Type', render: r => <span className={r.isDefault ? 'badge-gray' : 'badge-orange'}>{r.isDefault ? 'Default' : 'Custom'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Expense Category', placeholder: 'e.g. Electricity, Transport, Rent' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What expenses go in this category' },
      ]}
      defaultValues={{ name: '', description: '' }}
      canDelete={r => !r.isDefault}
    />
  );
}
