# BrickSoft — Brick Manufacturing Management Software (Plan)

Operations software for brick plants (fly ash, red clay, solid/hollow blocks, pavers, AAC):
production, raw materials, stock, sales, payments, labour, expenses, cash and reports.
Multi-plant, role-based, mobile-friendly web app.

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, React Router, TanStack Query, Tailwind CSS + shadcn/ui (or MUI), react-hook-form + zod, Recharts, dayjs |
| Backend | Node.js 20 + Express, Prisma ORM, zod validation, JWT (access + refresh), bcrypt |
| Database | PostgreSQL (relational + transactions — money and stock must stay consistent) |
| PDF | pdfkit (invoices, customer statements, receipts) |
| Sharing | WhatsApp via `wa.me` link + PDF download / Web Share API |
| Jobs | node-cron (low-stock alerts, due reminders) |
| Later | PWA / React Native app, push notifications (FCM), SMS OTP login |

## 2. Modules

### 2.1 Auth & organization
- Login with mobile number + password (OTP later)
- Organization (company) → many Plants
- Users with a role and a plant scope (all plants or selected ones)
- Plant switcher in the header; the owner can view all plants together

### 2.2 Setup / masters
- Plants (name, address, GSTIN)
- Products / brick sizes (name, type, size L×W×H, unit, default rate, HSN, GST %)
- Raw materials (fly ash, cement, sand, stone dust, lime, gypsum, clay, coal…; unit, low-stock threshold)
- Recipes: materials needed per 1,000 units of each product (editable per plant)
- Customers (name, mobile, address, GSTIN, opening balance, credit limit)
- Suppliers (name, mobile, material supplied, opening balance)
- Workers / labour (name, type: piece-rate / daily wage / monthly, rate)
- Vehicles / transporters (optional)
- Expense categories, payment accounts (cash in hand, bank, UPI)

### 2.3 Production
- Daily production entry: date, plant, product, quantity produced, damaged/broken qty, shift, notes
- Material consumption is filled in automatically from the recipe and can be edited before saving
- Labour linked to production (piece-rate workers earn per 1,000 units)
- Posting a production entry → finished stock goes up, raw material stock goes down (in one DB transaction)
- Production + consumption views by day and month

### 2.4 Inventory
- Raw material stock and finished goods stock per plant
- Purchases: supplier, material, qty, rate, amount, transport, amount paid → stock in + supplier dues
- Stock adjustments (damage, correction, opening stock) with a reason; needs approval by role
- Stock movement ledger (every in/out with its source document)
- Low-stock alerts based on thresholds

### 2.5 Sales, billing & customer dues
- Sales invoices: customer, items (product, qty, rate), GST (optional), transport/loading charges, discount
- Delivery/challan details (vehicle, driver, site address)
- Invoice → finished stock goes down, customer balance goes up
- Payments received (cash/UPI/bank/cheque), advances, adjusting payments against invoices
- Customer ledger and outstanding balances, with ageing (0–30 / 31–60 / 60+ days)
- Customer statement PDF (sales, payments, advance, GST, transport, closing balance)
- Share an invoice, receipt or reminder on WhatsApp

### 2.6 Labour
- Attendance (daily wage workers)
- Piece-rate earnings from production
- Advances, wage payments, worker ledger and balance due

### 2.7 Expenses & cash
- Expense entry (category, amount, account, plant, bill photo)
- Cash accounts per cashier: fund added, handover between users, day book
- Supplier payments
- Daily cash summary (opening, in, out, closing)

### 2.8 Dashboard & reports
- KPI cards: today's/month's production, finished stock, sales, collections, outstanding dues, expenses
- Charts: production trend, sales vs. collection, expense breakdown
- Reports (filter by date and plant, export PDF/Excel): production, material consumption, stock summary,
  sales register, GST summary, customer outstanding, supplier dues, labour, expenses, day book, simple P&L

### 2.9 Notifications
- Notification bell: low stock, overdue customer dues, pending approvals
- User preferences for which alerts to receive

### 2.10 Users, roles & audit
- Roles: Owner, Manager, Accountant/Cashier, Supervisor (production entry), Sales, Viewer
- Permission matrix per module (view/create/edit/delete/approve)
- Audit log: who changed what and when, with old and new values
- Corrections: editing or deleting a posted entry creates a reversal (no silent edits); edits after N days need approval

## 3. Database (main tables)

```
organizations, plants, users, roles, role_permissions, user_plants
products, raw_materials, recipes, recipe_items
customers, suppliers, workers, vehicles, expense_categories, accounts
production_entries, production_consumptions, production_labour
purchases, purchase_items
stock_movements  (plant_id, item_type[product|material], item_id, qty_in, qty_out, ref_type, ref_id, date)
stock_adjustments
invoices, invoice_items, payments_received, payment_allocations
supplier_payments, expenses
attendance, wage_payments, worker_advances
cash_transactions (fund_add, handover, expense, receipt…)
notifications, audit_logs
```
Stock and balances are calculated from the ledgers (`stock_movements`, `payments_received`, and so on), not stored as editable numbers.
Every table has `organization_id` + `plant_id` so data stays separate between companies and plants.

## 4. API (REST, `/api/v1`)

```
POST /auth/login, /auth/refresh, /auth/logout, GET /auth/me
CRUD /plants /products /materials /recipes /customers /suppliers /workers /accounts /expense-categories /users /roles
/production        GET, POST, GET/:id, PUT/:id, DELETE/:id (reversal)
/purchases         ...
/stock             GET summary, GET /movements, POST /adjustments
/invoices          ... + GET /:id/pdf
/payments          ... + GET /:id/receipt
/customers/:id/ledger, /customers/:id/statement.pdf
/labour/attendance, /labour/payments, /labour/advances
/expenses, /cash/transactions, /cash/daybook
/dashboard/summary
/reports/:type?from=&to=&plantId=
/notifications, /audit-logs
```
Middleware: `auth` (JWT) → `plantScope` (checks the plant is allowed) → `can('module','action')` → zod validation.

## 5. Folder structure

```
backend/
  prisma/schema.prisma, seed.js
  src/
    app.js, server.js
    config/, middleware/ (auth, permissions, plantScope, errorHandler)
    modules/<module>/ (routes.js, controller.js, service.js, schema.js)
    services/ (stock.service.js, ledger.service.js, pdf/, notify/)
    jobs/ (lowStock.js, dueReminders.js)
    utils/
frontend/
  src/
    main.jsx, App.jsx, routes.jsx
    api/ (axios client + query hooks per module)
    components/ (layout, sidebar, plant switcher, DataTable, forms, KPI cards)
    features/<module>/ (list page, form page, detail page)
    context/ (auth, current plant)
    utils/ (format currency ₹, dates, permissions)
```

## 6. Build phases

1. **Foundation**: project setup, DB schema, auth, users/roles, plants, app layout with sidebar and plant switcher
2. **Masters**: products, materials, recipes, customers, suppliers, workers, accounts
3. **Production + inventory**: production entry with recipe consumption, purchases, stock ledger, adjustments
4. **Sales**: invoices, payments, customer ledger/outstanding, invoice/statement PDFs, WhatsApp share
5. **Labour, expenses, cash**: attendance, wages, expenses, cashier accounts, day book
6. **Dashboard + reports**: KPIs, charts, reports with PDF/Excel export
7. **Notifications, audit log, approvals**, polish, mobile responsiveness
8. **Deploy**: Docker, Postgres backups, HTTPS; later a PWA or mobile app
