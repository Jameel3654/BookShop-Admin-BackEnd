const express = require('express');
const { 
  addStock, 
  getAllStock, 
  getStockYears,
  updateStock,
  deleteStock
} = require('../controllers/stock.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', authMiddleware, addStock);
router.get('/', authMiddleware, getAllStock);
router.get('/years', authMiddleware, getStockYears);
router.put('/:id', authMiddleware, updateStock);
router.delete('/:id', authMiddleware, deleteStock);

module.exports = router;