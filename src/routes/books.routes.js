const express = require('express');
const { createBook, getBooks, getBooksAdmin, getPublicBooks, updateBookVisibility } = require('../controllers/books.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/public', getPublicBooks); 
router.post('/', authMiddleware, createBook);
router.get('/', authMiddleware, getBooks);
router.get('/admin', authMiddleware, getBooksAdmin); 
router.patch('/:id/visibility', authMiddleware, updateBookVisibility);

module.exports = router;