const pool = require('../config/db');

const addStock = async (req, res) => {
  try {
    const { book_id, edition_year, buy_price, sell_price, quantity } = req.body;

    if (!book_id || !edition_year || !buy_price || !sell_price || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if this edition already exists
    const existing = await pool.query(
      'SELECT * FROM book_stock WHERE book_id = $1 AND edition_year = $2',
      [book_id, edition_year]
    );

    if (existing.rows.length > 0) {
      // Update existing stock
      const result = await pool.query(
        `UPDATE book_stock 
         SET total_stock = total_stock + $1,
             available_stock = available_stock + $1,
             buy_price = $2,
             sell_price = $3
         WHERE book_id = $4 AND edition_year = $5
         RETURNING *`,
        [quantity, buy_price, sell_price, book_id, edition_year]
      );
      return res.json(result.rows[0]);
    } else {
      // Create new stock entry
      const result = await pool.query(
        `INSERT INTO book_stock (book_id, edition_year, buy_price, sell_price, total_stock, available_stock)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [book_id, edition_year, buy_price, sell_price, quantity, quantity]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStockByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const result = await pool.query(
      `SELECT bs.*, b.name as book_name, b.ssn 
       FROM book_stock bs
       JOIN books b ON bs.book_id = b.id
       WHERE bs.book_id = $1
       ORDER BY bs.added_at DESC`,
      [bookId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllStock = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bs.*, b.name as book_name, b.ssn 
       FROM book_stock bs
       JOIN books b ON bs.book_id = b.id
       ORDER BY bs.added_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addStock, getStockByBook, getAllStock };