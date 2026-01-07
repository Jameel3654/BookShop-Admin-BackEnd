const express = require('express');
const { addStock, getStockByBook, getAllStock } = require('../controllers/stock.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', authMiddleware, addStock);
router.get('/', authMiddleware, getAllStock);
router.get('/:bookId', authMiddleware, getStockByBook);

module.exports = router;