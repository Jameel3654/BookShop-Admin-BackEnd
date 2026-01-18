const express = require('express');
const { 
  createSale, 
  getSales,
  updateSale,
  deleteSale,
  getFinanceReport
} = require('../controllers/sales.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', authMiddleware, createSale);
router.get('/', authMiddleware, getSales);
router.put('/:id', authMiddleware, updateSale);
router.delete('/:id', authMiddleware, deleteSale);
router.get('/finance', authMiddleware, getFinanceReport);

module.exports = router;