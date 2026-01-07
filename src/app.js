const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const booksRoutes = require('./routes/books.routes');
const stockRoutes = require('./routes/stock.routes');
const salesRoutes = require('./routes/sales.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/export', exportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Book Inventory API' });
});

module.exports = app;
