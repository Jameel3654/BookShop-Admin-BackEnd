const express = require('express');
const { exportStock, exportSales, exportFinance } = require('../controllers/export.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/stock', authMiddleware, exportStock);
router.get('/sales', authMiddleware, exportSales);
router.get('/finance', authMiddleware, exportFinance);

module.exports = router;