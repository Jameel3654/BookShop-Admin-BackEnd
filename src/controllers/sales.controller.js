const pool = require('../config/db');

const createSale = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { stock_id, quantity_sold, amount_received, payment_method, sell_location } = req.body;

    if (!stock_id || !quantity_sold) {
      return res.status(400).json({ message: 'Stock ID and quantity are required' });
    }

    // Get stock details
    const stockResult = await client.query(
      'SELECT * FROM book_stock WHERE id = $1',
      [stock_id]
    );

    if (stockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Stock not found' });
    }

    const stock = stockResult.rows[0];

    if (stock.available_stock < quantity_sold) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    // Calculate values
    const total_bill = stock.sell_price * quantity_sold;
    const profit = (stock.sell_price - stock.buy_price) * quantity_sold;
    const received = amount_received || 0;
    const payment_status = received >= total_bill ? 'RECEIVED' : 'PENDING';

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (stock_id, quantity_sold, total_bill, amount_received, payment_status, payment_method, sell_location, profit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [stock_id, quantity_sold, total_bill, received, payment_status, payment_method, sell_location, profit]
    );

    // Update stock
    await client.query(
      'UPDATE book_stock SET available_stock = available_stock - $1 WHERE id = $2',
      [quantity_sold, stock_id]
    );

    await client.query('COMMIT');
    res.status(201).json(saleResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

const getSales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, bs.edition_year, bs.sell_price, b.name as book_name, b.ssn
       FROM sales s
       JOIN book_stock bs ON s.stock_id = bs.id
       JOIN books b ON bs.book_id = b.id
       ORDER BY s.sold_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFinanceReport = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, bs.edition_year, b.name as book_name, b.ssn,
              (s.total_bill - s.amount_received) as pending_amount
       FROM sales s
       JOIN book_stock bs ON s.stock_id = bs.id
       JOIN books b ON bs.book_id = b.id
       ORDER BY s.sold_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get finance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSale, getSales, getFinanceReport };