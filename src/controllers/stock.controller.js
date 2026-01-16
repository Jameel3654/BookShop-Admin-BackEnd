const pool = require('../config/db');

const addStock = async (req, res) => {
  try {
    const { 
      book_id, year, 
      buy_price_new, sell_price_new, quantity_new,
      buy_price_old, sell_price_old, quantity_old
    } = req.body;

    if (!book_id || !year) {
      return res.status(400).json({ message: 'Book ID and year are required' });
    }

    const existing = await pool.query(
      'SELECT * FROM book_stock WHERE book_id = $1 AND year = $2',
      [book_id, year]
    );

    if (existing.rows.length > 0) {
      // Update existing stock
      const result = await pool.query(
        `UPDATE book_stock 
         SET total_stock_new = total_stock_new + $1,
             available_stock_new = available_stock_new + $1,
             total_stock_old = total_stock_old + $2,
             available_stock_old = available_stock_old + $2,
             buy_price_new = $3,
             sell_price_new = $4,
             buy_price_old = $5,
             sell_price_old = $6
         WHERE book_id = $7 AND year = $8
         RETURNING *`,
        [
          quantity_new || 0, quantity_old || 0,
          buy_price_new, sell_price_new, buy_price_old, sell_price_old,
          book_id, year
        ]
      );
      return res.json(result.rows[0]);
    } else {
      // Create new stock entry
      const result = await pool.query(
        `INSERT INTO book_stock (
          book_id, year, 
          buy_price_new, sell_price_new, 
          buy_price_old, sell_price_old,
          total_stock_new, available_stock_new,
          total_stock_old, available_stock_old
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $8) RETURNING *`,
        [
          book_id, year,
          buy_price_new, sell_price_new,
          buy_price_old, sell_price_old,
          quantity_new || 0,
          quantity_old || 0
        ]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllStock = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bs.*, b.name as book_name, b.name_urdu, b.ssn 
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

const getStockYears = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT year FROM book_stock ORDER BY year DESC'
    );
    res.json(result.rows.map(r => r.year));
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addStock, getAllStock, getStockYears };