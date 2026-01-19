const pool = require('../config/db');

// Public endpoint - with prices
const getPublicBooks = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        b.*,
        COALESCE(SUM(bs.available_stock_new + bs.available_stock_old), 0) as total_available,
        MIN(CASE WHEN bs.available_stock_new > 0 THEN bs.sell_price_new END) as min_price_new,
        MAX(CASE WHEN bs.available_stock_new > 0 THEN bs.sell_price_new END) as max_price_new,
        MIN(CASE WHEN bs.available_stock_old > 0 THEN bs.sell_price_old END) as min_price_old,
        MAX(CASE WHEN bs.available_stock_old > 0 THEN bs.sell_price_old END) as max_price_old,
        STRING_AGG(DISTINCT COALESCE(bs.year_new, bs.year_old), ', ') as available_years
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createBook = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, name_urdu, ssn } = req.body;

    if (!name || !ssn) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Name and SSN are required' });
    }

    const bookResult = await client.query(
      'INSERT INTO books (name, name_urdu, ssn, is_visible) VALUES ($1, $2, $3, true) RETURNING *',
      [name, name_urdu || null, ssn]
    );

    const newBook = bookResult.rows[0];

    // Create initial stock with new structure (separate years)
    await client.query(
      `INSERT INTO book_stock (
        book_id, year_new, year_old,
        buy_price_new, sell_price_new, 
        buy_price_old, sell_price_old,
        total_stock_new, available_stock_new,
        total_stock_old, available_stock_old
      ) VALUES ($1, '', '', 0, 0, 0, 0, 0, 0, 0, 0)`,
      [newBook.id]
    );

    await client.query('COMMIT');
    res.status(201).json(newBook);

  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Book with this SSN already exists' });
    }
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
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

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_urdu, ssn } = req.body;

    if (!name || !ssn) {
      return res.status(400).json({ message: 'Name and SSN are required' });
    }

    const result = await pool.query(
      'UPDATE books SET name = $1, name_urdu = $2, ssn = $3 WHERE id = $4 RETURNING *',
      [name, name_urdu || null, ssn, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Book with this SSN already exists' });
    }
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
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

module.exports = { 
  createBook, 
  getBooks, 
  getPublicBooks, 
  updateBookVisibility,
  updateBook,
  deleteBook
};