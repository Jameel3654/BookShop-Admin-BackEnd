const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();
const { addStock, getAllStock, getStockYears } = require('../controllers/stock.controller');
// const { addStock, getAllStock, getStockYears } = require('../controllers/stock.controller');


router.post('/', authMiddleware, addStock);
router.get('/', authMiddleware, getAllStock);
router.get('/:bookId', authMiddleware, getStockYears);
router.get('/years', authMiddleware, getStockYears);

module.exports = router;