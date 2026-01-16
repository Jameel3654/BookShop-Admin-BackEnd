const express = require('express');
const { createBook, getBooks, getPublicBooks, updateBookVisibility } = require('../controllers/books.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/public', getPublicBooks); // No auth required
router.post('/', authMiddleware, createBook);
router.get('/', authMiddleware, getBooks);
router.patch('/:id/visibility', authMiddleware, updateBookVisibility);

module.exports = router;