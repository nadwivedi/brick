import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ActivityPage from './pages/ActivityPage';
import ProductionPage from './pages/ProductionPage';
import InventoryPage from './pages/InventoryPage';
import StockLedgerPage from './pages/StockLedgerPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import ExpensesPage from './pages/ExpensesPage';
import MastersPage from './pages/MastersPage';
import PartyLedgerPage from './pages/PartyLedgerPage';
import ReportsPage from './pages/ReportsPage';
import LowStockPage from './pages/LowStockPage';
import SettingsPage from './pages/SettingsPage';

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

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/ledger/:materialId" element={<StockLedgerPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="masters/:tab" element={<MastersPage />} />
        <Route path="masters/customers/:id/ledger" element={<PartyLedgerPage key="customer" type="customer" />} />
        <Route path="masters/vendors/:id/ledger" element={<PartyLedgerPage key="vendor" type="vendor" />} />
        {/* Old links to the individual master screens */}
        <Route path="customers" element={<Navigate to="/masters/customers" replace />} />
        <Route path="vendors" element={<Navigate to="/masters/vendors" replace />} />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
