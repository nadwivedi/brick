const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Fallback to current working directory if available
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const productionRoutes = require('./routes/productionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const apiRoutes = require('./routes/apiRoutes');
const migrateParties = require('./utils/migrateParties');

connectDB()
  .then(() => migrateParties())
  .catch(e => console.error('❌ Party migration failed:', e.message));

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.json({ message: '🧱 BrickSoft API is running' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrickSoft Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
