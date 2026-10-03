# BrickSoft — Single-Shot AI Design Prompt

## Use this prompt with ChatGPT, Claude, Gemini, v0.dev, or Bolt.new to generate the full software in one shot.

---

## THE PROMPT (copy everything below):

Build a complete **Brick Manufacturing Management Software** called **BrickSoft** using:
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router DOM + Recharts + Axios + React Hot Toast + Lucide React
- **Backend**: Node.js + Express.js + MongoDB + Mongoose + JWT Authentication + bcryptjs
- **Design**: Modern professional UI. Orange (#f97316) brand color, Inter font, collapsible sidebar, card-based layout

---

### MODULES TO BUILD:

1. **Auth**: Login (mobile+password), Register (user + organization), JWT in localStorage, protected routes
2. **Dashboard**: 6 KPI cards, low stock banner, production bar chart (7d), sales line chart (7d), low stock table
3. **Production**: CRUD table with pagination, New Entry modal (date/plant/product/qty/shift/materials consumed)
4. **Inventory**: Stock levels table with mini progress bars, low stock alert section, 3 summary KPIs
5. **Purchases**: Buy raw materials from vendors, update material stock automatically, CRUD table
6. **Sales/Invoices**: Create invoices with line items (product×qty×rate), GST, transport, discount. Payment recording. Status: issued/partial/paid
7. **Expenses**: Category-based (Fuel/Electricity/Maintenance etc.), CRUD table, 4 summary cards
8. **Customers**: Full CRUD - name, mobile, address, GSTIN, opening balance, credit limit
9. **Vendors**: Full CRUD - name, mobile, address, materials supplied, balance due
10. **Labour/Workers**: Full CRUD - piece_rate/daily_wage/monthly types with rates
11. **Plants**: Full CRUD - multiple manufacturing plant locations
12. **Products (Brick Types)**: Full CRUD - fly_ash/red_clay/solid_block/hollow_block/paver/aac, sizes, rates, GST
13. **Raw Materials**: Full CRUD - name, unit, current stock, low stock threshold
14. **Reports**: Date range filter, preset buttons (Today/Week/Month), 4 tabs (Production/Sales/Expenses/Outstanding), charts
15. **Low Stock Alerts**: Materials below threshold, deficit calculation
16. **Settings**: Profile, Organization details, Notification toggles, Change password

---

### MONGODB MODELS (14 total):
User, Organization, Plant, Product, Material, Customer, Vendor, Worker, ProductionEntry, Invoice, Payment, Purchase, Expense, StockMovement

### KEY BUSINESS LOGIC:
- When Purchase is created → Material.currentStock += quantity for each item
- When Production is created → Material.currentStock -= quantity for each material used
- When Invoice is created → paidAmount + paymentMode → auto-creates Payment record; balanceDue = totalAmount - paidAmount; status auto-set
- Invoice number auto-generated: INV-0001, INV-0002 etc.
- All data scoped by organization._id (multi-tenant)

### API BASE: http://localhost:5000/api
### Frontend runs: http://localhost:5173

### DESIGN TOKENS:
- Brand: orange-500 (#f97316), orange-600 (#ea580c)  
- Sidebar: white bg, border-r, sticky, collapsible to icon-only
- Cards: white, rounded-xl, shadow-sm, border border-gray-100
- Tables: alternating hover, orange-50/30 on hover
- Badges: green (paid/active), red (low/overdue), orange (partial/type), gray (inactive)
- Currency: ₹ symbol, toLocaleString('en-IN')

Make it production-ready for Indian brick manufacturers. All 16 pages must be functional with real API calls.
