const pool = require('../config/db');

const addStock = async (req, res) => {
  try {
    const { 
      book_id, 
      year_new, 
      year_old,
      buy_price_new, 
      sell_price_new, 
      quantity_new,
      buy_price_old, 
      sell_price_old, 
      quantity_old
    } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if stock record exists for this book
    const existing = await pool.query(
      'SELECT * FROM book_stock WHERE book_id = $1',
      [book_id]
    );

    if (existing.rows.length > 0) {
      // Update existing stock
      const result = await pool.query(
        `UPDATE book_stock 
         SET year_new = COALESCE($1, year_new),
             year_old = COALESCE($2, year_old),
             total_stock_new = total_stock_new + COALESCE($3, 0),
             available_stock_new = available_stock_new + COALESCE($3, 0),
             total_stock_old = total_stock_old + COALESCE($4, 0),
             available_stock_old = available_stock_old + COALESCE($4, 0),
             buy_price_new = COALESCE($5, buy_price_new),
             sell_price_new = COALESCE($6, sell_price_new),
             buy_price_old = COALESCE($7, buy_price_old),
             sell_price_old = COALESCE($8, sell_price_old)
         WHERE book_id = $9
         RETURNING *`,
        [
          year_new || null,
          year_old || null,
          parseInt(quantity_new) || 0,
          parseInt(quantity_old) || 0,
          parseFloat(buy_price_new) || 0,
          parseFloat(sell_price_new) || 0,
          parseFloat(buy_price_old) || 0,
          parseFloat(sell_price_old) || 0,
          book_id
        ]
      );
      return res.json(result.rows[0]);
    } else {
      // Create new stock record
      const result = await pool.query(
        `INSERT INTO book_stock (
          book_id, 
          year_new, 
          year_old,
          buy_price_new, 
          sell_price_new, 
          buy_price_old, 
          sell_price_old,
          total_stock_new, 
          available_stock_new,
          total_stock_old, 
          available_stock_old
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9) 
        RETURNING *`,
        [
          book_id,
          year_new || '',
          year_old || '',
          parseFloat(buy_price_new) || 0,
          parseFloat(sell_price_new) || 0,
          parseFloat(buy_price_old) || 0,
          parseFloat(sell_price_old) || 0,
          parseInt(quantity_new) || 0,
          parseInt(quantity_old) || 0
        ]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      year_new, 
      year_old,
      buy_price_new, 
      sell_price_new, 
      buy_price_old, 
      sell_price_old,
      total_stock_new, 
      available_stock_new,
      total_stock_old, 
      available_stock_old
    } = req.body;

    const result = await pool.query(
      `UPDATE book_stock 
       SET year_new = $1, 
           year_old = $2,
           buy_price_new = $3, 
           sell_price_new = $4,
           buy_price_old = $5, 
           sell_price_old = $6,
           total_stock_new = $7, 
           available_stock_new = $8,
           total_stock_old = $9, 
           available_stock_old = $10
       WHERE id = $11 
       RETURNING *`,
      [
        year_new || '',
        year_old || '',
        parseFloat(buy_price_new) || 0,
        parseFloat(sell_price_new) || 0,
        parseFloat(buy_price_old) || 0,
        parseFloat(sell_price_old) || 0,
        parseInt(total_stock_new) || 0,
        parseInt(available_stock_new) || 0,
        parseInt(total_stock_old) || 0,
        parseInt(available_stock_old) || 0,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM book_stock WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    
    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStockYears = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT year_new as year FROM book_stock WHERE year_new IS NOT NULL AND year_new != ''
       UNION
       SELECT DISTINCT year_old as year FROM book_stock WHERE year_old IS NOT NULL AND year_old != ''
       ORDER BY year DESC`
    );
    res.json(result.rows.map(r => r.year));
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  addStock, 
  getAllStock, 
  updateStock, 
  deleteStock,
  getStockYears 
};