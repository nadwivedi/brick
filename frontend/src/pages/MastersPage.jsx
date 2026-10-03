import { Navigate, useParams } from 'react-router-dom';
import CustomersPage from './CustomersPage';
import VendorsPage from './VendorsPage';
import WorkersPage from './WorkersPage';
import PlantsPage from './PlantsPage';
import ProductsPage from './ProductsPage';
import MaterialsPage from './MaterialsPage';
import UnitsPage from './UnitsPage';
import ExpenseCategoriesPage from './ExpenseCategoriesPage';

// Master data: set up once here, then used across the operations screens.
// Navigation between masters lives in the sidebar.
const MASTERS = {
  'customers': CustomersPage,
  'vendors': VendorsPage,
  'labour': WorkersPage,
  'plants': PlantsPage,
  'brick-types': ProductsPage,
  'raw-materials': MaterialsPage,
  'units': UnitsPage,
  'expense-categories': ExpenseCategoriesPage,
};

export default function MastersPage() {
  const { tab } = useParams();
  const Page = MASTERS[tab];

  if (!Page) return <Navigate to="/masters/customers" replace />;

  return <Page key={tab} />;
}
