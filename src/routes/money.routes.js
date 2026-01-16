const express = require('express');
const { addMoney, getMoneyRecords } = require('../controllers/money.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', authMiddleware, addMoney);
router.get('/', authMiddleware, getMoneyRecords);

module.exports = router;