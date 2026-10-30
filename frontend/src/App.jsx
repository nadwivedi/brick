import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminAccessPage from './pages/AdminAccessPage';
import DashboardPage from './pages/DashboardPage';
import ActivityPage from './pages/ActivityPage';
import ProductionPage from './pages/ProductionPage';
import InventoryPage from './pages/InventoryPage';
import StockLedgerPage from './pages/StockLedgerPage';
import BrickLedgerPage from './pages/BrickLedgerPage';
import SalesPage from './pages/SalesPage';
import PartyPaymentsPage from './pages/PartyPaymentsPage';
import PurchasesPage from './pages/PurchasesPage';
import ExpensesPage from './pages/ExpensesPage';
import AccountsPage from './pages/AccountsPage';
import AccountLedgerPage from './pages/AccountLedgerPage';
import MastersPage from './pages/MastersPage';
import PartyLedgerPage from './pages/PartyLedgerPage';
import VehicleLedgerPage from './pages/VehicleLedgerPage';
import ReportsPage from './pages/ReportsPage';
import LowStockPage from './pages/LowStockPage';
import SettingsPage from './pages/SettingsPage';

const OldLedgerLink = () => <Navigate to={`/masters/parties/${useParams().id}/ledger`} replace />;

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// Unknown links go to the dashboard, which sends logged-out visitors to the login page
const Fallback = () => <Navigate to="/dashboard" replace />;

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      {/* Accounts are created from the admin panel; old register links open the login */}
      <Route path="/register" element={<Navigate to="/login" replace />} />
      {/* Opened from the admin panel; replaces a session already open in this browser */}
      <Route path="/admin-access" element={<AdminAccessPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* The public website (homepage, product pages) is the separate app in web/ */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/ledger/:materialId" element={<StockLedgerPage />} />
        <Route path="inventory/bricks/:productId" element={<BrickLedgerPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="receipts" element={<PartyPaymentsPage key="customer" type="customer" />} />
        <Route path="payments" element={<PartyPaymentsPage key="vendor" type="vendor" />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="accounts/:id" element={<AccountLedgerPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="masters/:tab" element={<MastersPage />} />
        <Route path="masters/parties/:id/ledger" element={<PartyLedgerPage />} />
        <Route path="masters/vehicles/:id/ledger" element={<VehicleLedgerPage />} />
        {/* Customers and vendors became parties with the same ids, so old ledger links still work */}
        <Route path="masters/customers/:id/ledger" element={<OldLedgerLink />} />
        <Route path="masters/vendors/:id/ledger" element={<OldLedgerLink />} />
        {/* Old links to the individual master screens */}
        <Route path="customers" element={<Navigate to="/masters/parties" replace />} />
        <Route path="vendors" element={<Navigate to="/masters/parties" replace />} />
        <Route path="parties" element={<Navigate to="/masters/parties" replace />} />
        <Route path="workers" element={<Navigate to="/masters/labour" replace />} />
        <Route path="products" element={<Navigate to="/masters/brick-types" replace />} />
        <Route path="materials" element={<Navigate to="/masters/raw-materials" replace />} />
        <Route path="units" element={<Navigate to="/masters/units" replace />} />
        <Route path="expense-categories" element={<Navigate to="/masters/expense-categories" replace />} />
        <Route path="plants" element={<Navigate to="/masters/plants" replace />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="low-stock" element={<LowStockPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Fallback />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '14px', fontFamily: 'Poppins, sans-serif' },
            success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
