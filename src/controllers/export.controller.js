const ExcelJS = require('exceljs');
const pool = require('../config/db');

const exportStock = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.name, b.ssn, bs.edition_year, bs.buy_price, bs.sell_price, 
              bs.total_stock, bs.available_stock, bs.added_at
       FROM book_stock bs
       JOIN books b ON bs.book_id = b.id
       ORDER BY b.name, bs.edition_year`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'Edition/Year', key: 'edition_year', width: 15 },
      { header: 'Buy Price', key: 'buy_price', width: 12 },
      { header: 'Sell Price', key: 'sell_price', width: 12 },
      { header: 'Total Stock', key: 'total_stock', width: 12 },
      { header: 'Available', key: 'available_stock', width: 12 },
      { header: 'Added At', key: 'added_at', width: 20 }
    ];

    worksheet.addRows(result.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportSales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.name, b.ssn, bs.edition_year, s.quantity_sold, s.total_bill,
              s.amount_received, s.payment_status, s.payment_method, 
              s.sell_location, s.profit, s.sold_at
       FROM sales s
       JOIN book_stock bs ON s.stock_id = bs.id
       JOIN books b ON bs.book_id = b.id
       ORDER BY s.sold_at DESC`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'Edition/Year', key: 'edition_year', width: 15 },
      { header: 'Quantity', key: 'quantity_sold', width: 10 },
      { header: 'Total Bill', key: 'total_bill', width: 12 },
      { header: 'Received', key: 'amount_received', width: 12 },
      { header: 'Status', key: 'payment_status', width: 12 },
      { header: 'Method', key: 'payment_method', width: 12 },
      { header: 'Location', key: 'sell_location', width: 20 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Date', key: 'sold_at', width: 20 }
    ];

    worksheet.addRows(result.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportFinance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.name, b.ssn, bs.edition_year, s.total_bill, s.amount_received,
              (s.total_bill - s.amount_received) as pending_amount,
              s.payment_status, s.profit, s.sold_at
       FROM sales s
       JOIN book_stock bs ON s.stock_id = bs.id
       JOIN books b ON bs.book_id = b.id
       ORDER BY s.sold_at DESC`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Finance');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'Edition/Year', key: 'edition_year', width: 15 },
      { header: 'Total Bill', key: 'total_bill', width: 12 },
      { header: 'Received', key: 'amount_received', width: 12 },
      { header: 'Pending', key: 'pending_amount', width: 12 },
      { header: 'Status', key: 'payment_status', width: 12 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Date', key: 'sold_at', width: 20 }
    ];

    worksheet.addRows(result.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=finance.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export finance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { exportStock, exportSales, exportFinance };