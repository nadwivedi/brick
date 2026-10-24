const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Fallback to current working directory if available

// Logins can't be signed or checked without a secret, so refuse to start rather than fail on every request
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.');
  process.exit(1);
}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const productionRoutes = require('./routes/productionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const apiRoutes = require('./routes/apiRoutes');
const accountRoutes = require('./routes/accountRoutes');
const migrateParties = require('./utils/migrateParties');
const migrateAccounts = require('./utils/migrateAccounts');
const Invoice = require('./models/Invoice');

connectDB()
  .then(() => migrateParties())
  .then(() => migrateAccounts())
  // Brings the database indexes in line with the models, e.g. invoice numbers unique per business
  // instead of across all businesses (the old index is dropped)
  .then(() => Invoice.syncIndexes())
  .catch(e => console.error('❌ Startup data update failed:', e.message));

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174','http://localhost:5175'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.json({ message: '🧱 BrickSoft API is running' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrickSoft Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
