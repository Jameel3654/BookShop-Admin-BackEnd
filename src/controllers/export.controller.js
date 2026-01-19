const ExcelJS = require('exceljs');
const pool = require('../config/db');

const exportStock = async (req, res) => {
  try {
    const { years } = req.query;
    
    let query = `
      SELECT b.name, b.name_urdu, b.ssn, 
             bs.year_new, bs.year_old,
             bs.buy_price_new, bs.sell_price_new,
             bs.buy_price_old, bs.sell_price_old,
             bs.total_stock_new, bs.available_stock_new,
             bs.total_stock_old, bs.available_stock_old,
             bs.added_at
      FROM book_stock bs
      JOIN books b ON bs.book_id = b.id
    `;
    
    const params = [];
    if (years) {
      const yearArray = years.split(',');
      query += ` WHERE bs.year_new = ANY($1) OR bs.year_old = ANY($1)`;
      params.push(yearArray);
    }
    
    query += ` ORDER BY b.name`;
    
    const result = await pool.query(query, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'Name (Urdu)', key: 'name_urdu', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'New Year', key: 'year_new', width: 10 },
      { header: 'New Buy Price', key: 'buy_price_new', width: 15 },
      { header: 'New Sell Price', key: 'sell_price_new', width: 15 },
      { header: 'Total New', key: 'total_stock_new', width: 12 },
      { header: 'Available New', key: 'available_stock_new', width: 12 },
      { header: 'Old Year', key: 'year_old', width: 10 },
      { header: 'Old Buy Price', key: 'buy_price_old', width: 15 },
      { header: 'Old Sell Price', key: 'sell_price_old', width: 15 },
      { header: 'Total Old', key: 'total_stock_old', width: 12 },
      { header: 'Available Old', key: 'available_stock_old', width: 12 }
    ];

    worksheet.addRows(result.rows);
    
    const totalNew = result.rows.reduce((sum, row) => sum + parseInt(row.available_stock_new || 0), 0);
    const totalOld = result.rows.reduce((sum, row) => sum + parseInt(row.available_stock_old || 0), 0);
    
    worksheet.addRow({});
    worksheet.addRow({
      name: 'TOTAL BOOKS REMAINING:',
      available_stock_new: totalNew,
      available_stock_old: totalOld
    });

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
    const { years } = req.query;
    
    let query = `
      SELECT b.name, b.name_urdu, b.ssn, bs.year, 
             s.book_condition, s.quantity_sold, s.unit_price,
             s.total_bill, s.amount_received, s.payment_status,
             s.payment_method, s.sell_location, s.profit, s.sold_at
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
    
    // Get additional money
    const moneyResult = await pool.query(
      'SELECT * FROM additional_money ORDER BY added_at DESC'
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'Name (Urdu)', key: 'name_urdu', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Condition', key: 'book_condition', width: 10 },
      { header: 'Quantity', key: 'quantity_sold', width: 10 },
      { header: 'Unit Price', key: 'unit_price', width: 12 },
      { header: 'Total Bill', key: 'total_bill', width: 12 },
      { header: 'Received', key: 'amount_received', width: 12 },
      { header: 'Status', key: 'payment_status', width: 12 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Date', key: 'sold_at', width: 20 }
    ];

    worksheet.addRows(result.rows);
    
    // Add summary
    const totalSales = result.rows.reduce((sum, row) => sum + parseFloat(row.total_bill), 0);
    const totalProfit = result.rows.reduce((sum, row) => sum + parseFloat(row.profit), 0);
    const additionalIncome = moneyResult.rows
      .filter(m => m.type === 'INCOME')
      .reduce((sum, row) => sum + parseFloat(row.amount), 0);
    const additionalExpense = moneyResult.rows
      .filter(m => m.type === 'EXPENSE')
      .reduce((sum, row) => sum + parseFloat(row.amount), 0);
    
    worksheet.addRow({});
    worksheet.addRow({ name: 'SALES SUMMARY' });
    worksheet.addRow({ name: 'Total Sales:', total_bill: totalSales });
    worksheet.addRow({ name: 'Total Profit:', total_bill: totalProfit });
    worksheet.addRow({ name: 'Additional Income:', total_bill: additionalIncome });
    worksheet.addRow({ name: 'Additional Expense:', total_bill: additionalExpense });
    worksheet.addRow({ name: 'NET TOTAL:', total_bill: totalSales + additionalIncome - additionalExpense });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { exportStock, exportSales };
