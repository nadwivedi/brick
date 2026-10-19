import { Navigate, useParams } from 'react-router-dom';
import PartiesPage from './PartiesPage';
import WorkersPage from './WorkersPage';
import PlantsPage from './PlantsPage';
import ProductsPage from './ProductsPage';
import MaterialsPage from './MaterialsPage';
import UnitsPage from './UnitsPage';
import ExpenseCategoriesPage from './ExpenseCategoriesPage';

// Master data: set up once here, then used across the operations screens.
// Navigation between masters lives in the sidebar.
const MASTERS = {
  'parties': PartiesPage,
  'labour': WorkersPage,
  'plants': PlantsPage,
  'brick-types': ProductsPage,
  'raw-materials': MaterialsPage,
  'units': UnitsPage,
  'expense-categories': ExpenseCategoriesPage,
};

// Customers and vendors used to have their own screens; both now live under Parties
const OLD_PARTY_TABS = { customers: 'customer', vendors: 'vendor' };

export default function MastersPage() {
  const { tab } = useParams();
  const Page = MASTERS[tab];

  if (OLD_PARTY_TABS[tab]) return <Navigate to={`/masters/parties?type=${OLD_PARTY_TABS[tab]}`} replace />;
  if (!Page) return <Navigate to="/masters/parties" replace />;

  return <Page key={tab} />;
}
