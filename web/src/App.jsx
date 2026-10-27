import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  BHATTA_PAGE, BILLING_PAGE, EXPENSE_PAGE, FEATURES_PAGE, INVENTORY_PAGE, MANUFACTURING_PAGE, ONLINE_PAGE, PAYMENT_PAGE, PLANT_PAGE,
  PRICE_PAGE, PRODUCTION_PAGE, REPORTS_PAGE,
} from './lib/publicNav';

import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import BrickKilnPricePage from './pages/BrickKilnPricePage';
import BhattaSoftwarePage from './pages/BhattaSoftwarePage';
import BricksManufacturingPage from './pages/BricksManufacturingPage';
import BrickPlantManagementPage from './pages/BrickPlantManagementPage';
import OnlineBrickKilnPage from './pages/OnlineBrickKilnPage';
import BrickKilnProductionPage from './pages/BrickKilnProductionPage';
import BrickKilnInventoryPage from './pages/BrickKilnInventoryPage';
import BrickKilnExpensePage from './pages/BrickKilnExpensePage';
import BrickKilnBillingPage from './pages/BrickKilnBillingPage';
import BrickKilnReportsPage from './pages/BrickKilnReportsPage';
import BrickKilnPaymentPage from './pages/BrickKilnPaymentPage';

// The public website: homepage and product pages. Login, register and the dashboard live in the frontend/ app.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path={FEATURES_PAGE} element={<FeaturesPage />} />
        <Route path={PRICE_PAGE} element={<BrickKilnPricePage />} />
        <Route path={BHATTA_PAGE} element={<BhattaSoftwarePage />} />
        <Route path={MANUFACTURING_PAGE} element={<BricksManufacturingPage />} />
        <Route path={PLANT_PAGE} element={<BrickPlantManagementPage />} />
        <Route path={ONLINE_PAGE} element={<OnlineBrickKilnPage />} />
        <Route path={PRODUCTION_PAGE} element={<BrickKilnProductionPage />} />
        <Route path={INVENTORY_PAGE} element={<BrickKilnInventoryPage />} />
        <Route path={EXPENSE_PAGE} element={<BrickKilnExpensePage />} />
        <Route path={BILLING_PAGE} element={<BrickKilnBillingPage />} />
        <Route path={REPORTS_PAGE} element={<BrickKilnReportsPage />} />
        <Route path={PAYMENT_PAGE} element={<BrickKilnPaymentPage />} />
        {/* Unknown links go to the homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: '14px', fontFamily: 'Poppins, sans-serif' },
          success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
