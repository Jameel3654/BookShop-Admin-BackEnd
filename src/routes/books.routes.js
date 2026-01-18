const express = require('express');
const { 
  createBook, 
  getBooks, 
  getPublicBooks, 
  updateBookVisibility,
  updateBook,
  deleteBook
} = require('../controllers/books.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/public', getPublicBooks); 
router.post('/', authMiddleware, createBook);
router.get('/', authMiddleware, getBooks);
router.patch('/:id/visibility', authMiddleware, updateBookVisibility);
router.put('/:id', authMiddleware, updateBook);
router.delete('/:id', authMiddleware, deleteBook);

module.exports = router;