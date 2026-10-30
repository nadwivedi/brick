import {
  ABOUT_PAGE, APP_PAGE, BHATTA_PAGE, BILLING_PAGE, CONTACT_PAGE, COST_GUIDE_PAGE, EXPENSE_PAGE, FACTORY_PAGE, FEATURES_PAGE, FLY_ASH_PAGE, HINDI_PAGE, INVENTORY_PAGE,
  MANUFACTURING_PAGE, ONLINE_PAGE, PAYMENT_PAGE, PLANT_PAGE, PRICE_PAGE, PRODUCTION_PAGE, REPORTS_PAGE,
} from './lib/publicNav';

import * as Home from './pages/HomePage';
import * as Features from './pages/FeaturesPage';
import * as Contact from './pages/ContactPage';
import * as About from './pages/AboutPage';
import * as HindiBhatta from './pages/HindiBhattaPage';
import * as CostPerBrickGuide from './pages/CostPerBrickGuidePage';
import * as BrickKilnPrice from './pages/BrickKilnPricePage';
import * as BhattaSoftware from './pages/BhattaSoftwarePage';
import * as BricksManufacturing from './pages/BricksManufacturingPage';
import * as BricksFactory from './pages/BricksFactoryPage';
import * as FlyAshBrick from './pages/FlyAshBrickPage';
import * as BrickPlantManagement from './pages/BrickPlantManagementPage';
import * as OnlineBrickKiln from './pages/OnlineBrickKilnPage';
import * as BrickKilnProduction from './pages/BrickKilnProductionPage';
import * as BrickKilnInventory from './pages/BrickKilnInventoryPage';
import * as BrickKilnExpense from './pages/BrickKilnExpensePage';
import * as BrickKilnBilling from './pages/BrickKilnBillingPage';
import * as BrickKilnReports from './pages/BrickKilnReportsPage';
import * as BrickKilnPayment from './pages/BrickKilnPaymentPage';
import * as BrickKilnApp from './pages/BrickKilnAppPage';

// Every page of the website, with the title and description each page exports.
// App.jsx routes from this list and src/prerender.jsx builds one HTML file per entry.
const page = (path, mod, extra) => ({ path, Component: mod.default, title: mod.TITLE, description: mod.DESCRIPTION, lang: 'en', ...extra });

export const PAGES = [
  page('/', Home),
  page(FEATURES_PAGE, Features),
  page(ABOUT_PAGE, About),
  page(CONTACT_PAGE, Contact),
  page(HINDI_PAGE, HindiBhatta, { lang: 'hi' }),
  page(COST_GUIDE_PAGE, CostPerBrickGuide),
  page(PRICE_PAGE, BrickKilnPrice),
  page(BHATTA_PAGE, BhattaSoftware),
  page(MANUFACTURING_PAGE, BricksManufacturing),
  page(FACTORY_PAGE, BricksFactory),
  page(FLY_ASH_PAGE, FlyAshBrick),
  page(PLANT_PAGE, BrickPlantManagement),
  page(ONLINE_PAGE, OnlineBrickKiln),
  page(PRODUCTION_PAGE, BrickKilnProduction),
  page(INVENTORY_PAGE, BrickKilnInventory),
  page(EXPENSE_PAGE, BrickKilnExpense),
  page(BILLING_PAGE, BrickKilnBilling),
  page(REPORTS_PAGE, BrickKilnReports),
  page(PAYMENT_PAGE, BrickKilnPayment),
  page(APP_PAGE, BrickKilnApp),
];
