const pool = require('../config/db');

const createSale = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { 
      stock_id, condition, quantity_sold, 
      amount_received, payment_method, sell_location 
    } = req.body;

    if (!stock_id || !quantity_sold || !condition) {
      return res.status(400).json({ message: 'Stock ID, quantity, and condition are required' });
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
    const isNew = condition === 'NEW';
    
    const availableStock = isNew ? stock.available_stock_new : stock.available_stock_old;
    const sellPrice = isNew ? stock.sell_price_new : stock.sell_price_old;
    const buyPrice = isNew ? stock.buy_price_new : stock.buy_price_old;

    if (availableStock < quantity_sold) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    const total_bill = sellPrice * quantity_sold;
    const profit = (sellPrice - buyPrice) * quantity_sold;
    const received = amount_received || 0;
    const payment_status = received >= total_bill ? 'RECEIVED' : 'PENDING';

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (
        stock_id, book_condition, quantity_sold, unit_price, total_bill, 
        amount_received, payment_status, payment_method, sell_location, profit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        stock_id, condition, quantity_sold, sellPrice, total_bill,
        received, payment_status, payment_method, sell_location, profit
      ]
    );

    // Update stock
    const stockField = isNew ? 'available_stock_new' : 'available_stock_old';
    await client.query(
      `UPDATE book_stock SET ${stockField} = ${stockField} - $1 WHERE id = $2`,
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
    const { years } = req.query; // Can be comma-separated: "2024,2025"
    
    let query = `
      SELECT s.*, bs.year, b.name as book_name, b.name_urdu, b.ssn
      FROM sales s
      JOIN book_stock bs ON s.stock_id = bs.id
      JOIN books b ON bs.book_id = b.id
    `;
    
    const params = [];
    if (years) {
      const yearArray = years.split(',');
      query += ` WHERE bs.year = ANY($1)`;
      params.push(yearArray);
    }
    
    query += ` ORDER BY s.sold_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSale, getSales };
