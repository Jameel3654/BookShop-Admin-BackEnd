const express = require('express');
const { createBook, getBooks } = require('../controllers/books.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', authMiddleware, createBook);
router.get('/', authMiddleware, getBooks);

module.exports = router;