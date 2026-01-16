const pool = require('../config/db');

// Public endpoint - no auth required
const getPublicBooks = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT b.*, 
             COALESCE(SUM(bs.available_stock_new + bs.available_stock_old), 0) as total_available
      FROM books b
      LEFT JOIN book_stock bs ON b.id = bs.book_id
      WHERE b.is_visible = true
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (
        LOWER(b.name) LIKE LOWER($1) OR 
        LOWER(b.name_urdu) LIKE LOWER($1) OR 
        LOWER(b.ssn) LIKE LOWER($1)
      )`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY b.id ORDER BY b.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get public books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin endpoints (require auth)
const createBook = async (req, res) => {
  try {
    const { name, name_urdu, ssn } = req.body;

    if (!name || !ssn) {
      return res.status(400).json({ message: 'Name and SSN are required' });
    }

    const result = await pool.query(
      'INSERT INTO books (name, name_urdu, ssn, is_visible) VALUES ($1, $2, $3, true) RETURNING *',
      [name, name_urdu || null, ssn]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Book with this SSN already exists' });
    }
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBooks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    const result = await pool.query(
      'UPDATE books SET is_visible = $1 WHERE id = $2 RETURNING *',
      [is_visible, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBook, getBooks, getPublicBooks, updateBookVisibility };