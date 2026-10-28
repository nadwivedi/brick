export const FEATURES_PAGE = '/features';
export const ABOUT_PAGE = '/about';
export const CONTACT_PAGE = '/contact';
export const HINDI_PAGE = '/hi/eent-bhatta-software';
export const COST_GUIDE_PAGE = '/guides/how-to-calculate-cost-per-brick';
export const PRICE_PAGE = '/brick-kiln-software-price-in-india';
export const BHATTA_PAGE = '/bhatta-software';
export const MANUFACTURING_PAGE = '/bricks-manufacturing-software';
export const FACTORY_PAGE = '/bricks-factory-management-software';
export const FLY_ASH_PAGE = '/fly-ash-brick-management-software';
export const PLANT_PAGE = '/brick-plant-management-software';
export const ONLINE_PAGE = '/online-brick-kiln-management-software';
export const PRODUCTION_PAGE = '/brick-kiln-production-management-software';
export const INVENTORY_PAGE = '/brick-kiln-inventory-management-software';
export const EXPENSE_PAGE = '/brick-kiln-expense-management-software';
export const BILLING_PAGE = '/brick-kiln-billing-software';
export const REPORTS_PAGE = '/brick-kiln-report-management-software';
export const PAYMENT_PAGE = '/brick-kiln-payment-tracking-software';

export const scrollToSection = (id) => {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
};
