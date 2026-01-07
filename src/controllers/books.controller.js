const pool = require('../config/db');

const createBook = async (req, res) => {
  try {
    const { name, ssn } = req.body;

    if (!name || !ssn) {
      return res.status(400).json({ message: 'Name and SSN are required' });
    }

    const result = await pool.query(
      'INSERT INTO books (name, ssn) VALUES ($1, $2) RETURNING *',
      [name, ssn]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Book with this name and SSN already exists' });
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

module.exports = { createBook, getBooks };
