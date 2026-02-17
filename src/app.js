const express = require('express');
const cors = require('cors');
const moneyRoutes = require('./routes/money.routes');
const authRoutes = require('./routes/auth.routes');
const booksRoutes = require('./routes/books.routes');
const stockRoutes = require('./routes/stock.routes');
const salesRoutes = require('./routes/sales.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// CORS configuration: allow requests from known frontends or, as a fallback,
// allow any origin (useful for cross-deployed FE/BE during development).
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:3001',
  'https://markaz-maktaba.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // If no origin (e.g. curl, server-to-server), allow the request.
    if (!origin) return callback(null, true);
    // Allow if origin is in the allow-list.
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Fallback: allow by default to prevent CORS errors across deployments.
    // For stricter control, replace the next line with: callback(new Error('Not allowed by CORS'))
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/money', moneyRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Book Inventory API' });
});

module.exports = app;
