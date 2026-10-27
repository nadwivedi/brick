import { useLocation, useNavigate } from 'react-router-dom';

export const FEATURES_PAGE = '/features';
export const CONTACT_PAGE = '/contact';
export const HINDI_PAGE = '/hi/eent-bhatta-software';
export const COST_GUIDE_PAGE = '/guides/how-to-calculate-cost-per-brick';
export const PRICE_PAGE = '/products/brick-kiln-software-price-in-india';
export const BHATTA_PAGE = '/products/bhatta-software';
export const MANUFACTURING_PAGE = '/products/bricks-manufacturing-software';
export const PLANT_PAGE = '/products/brick-plant-management-software';
export const ONLINE_PAGE = '/products/online-brick-kiln-management-software';
export const PRODUCTION_PAGE = '/products/brick-kiln-production-management-software';
export const INVENTORY_PAGE = '/products/brick-kiln-inventory-management-software';
export const EXPENSE_PAGE = '/products/brick-kiln-expense-management-software';
export const BILLING_PAGE = '/products/brick-kiln-billing-software';
export const REPORTS_PAGE = '/products/brick-kiln-report-management-software';
export const PAYMENT_PAGE = '/products/brick-kiln-payment-tracking-software';

export const scrollToSection = (id) => {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
};

// Links to homepage sections: scroll when already on the homepage, otherwise open it at that section
// (HomePage scrolls to the #hash once it renders).
export function useGoToSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (id) => (e) => {
    e.preventDefault();
    if (pathname === '/') scrollToSection(id);
    else navigate(`/#${id}`);
  };
}
