const ExcelJS = require('exceljs');
const pool = require('../config/db');

const exportStock = async (req, res) => {
  try {
    const { years } = req.query;
    
    let query;
    const params = [];
    
    if (years && years !== '') {
      const yearArray = years.split(',').filter(y => y);
      
      // Split into separate queries for NEW and OLD, then combine
      query = `
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          bs.year_new as year,
          'New' as condition,
          bs.buy_price_new as buy_price,
          bs.sell_price_new as sell_price,
          bs.total_stock_new as total_stock,
          bs.available_stock_new as available_stock
        FROM book_stock bs
        JOIN books b ON bs.book_id = b.id
        WHERE bs.year_new = ANY($1) AND bs.available_stock_new > 0
        
        UNION ALL
        
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          bs.year_old as year,
          'Old' as condition,
          bs.buy_price_old as buy_price,
          bs.sell_price_old as sell_price,
          bs.total_stock_old as total_stock,
          bs.available_stock_old as available_stock
        FROM book_stock bs
        JOIN books b ON bs.book_id = b.id
        WHERE bs.year_old = ANY($1) AND bs.available_stock_old > 0
        
        ORDER BY name, year DESC
      `;
      params.push(yearArray);
    } else {
      // Show all
      query = `
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          bs.year_new as year,
          'New' as condition,
          bs.buy_price_new as buy_price,
          bs.sell_price_new as sell_price,
          bs.total_stock_new as total_stock,
          bs.available_stock_new as available_stock
        FROM book_stock bs
        JOIN books b ON bs.book_id = b.id
        WHERE bs.year_new IS NOT NULL AND bs.year_new != '' AND bs.available_stock_new > 0
        
        UNION ALL
        
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          bs.year_old as year,
          'Old' as condition,
          bs.buy_price_old as buy_price,
          bs.sell_price_old as sell_price,
          bs.total_stock_old as total_stock,
          bs.available_stock_old as available_stock
        FROM book_stock bs
        JOIN books b ON bs.book_id = b.id
        WHERE bs.year_old IS NOT NULL AND bs.year_old != '' AND bs.available_stock_old > 0
        
        ORDER BY name, year DESC
      `;
    }
    
    const result = await pool.query(query, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock');

    worksheet.columns = [
      { header: 'Book Name', key: 'name', width: 30 },
      { header: 'Name (Urdu)', key: 'name_urdu', width: 30 },
      { header: 'SSN', key: 'ssn', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Condition', key: 'condition', width: 10 },
      { header: 'Buy Price', key: 'buy_price', width: 15 },
      { header: 'Sell Price', key: 'sell_price', width: 15 },
      { header: 'Total Stock', key: 'total_stock', width: 12 },
      { header: 'Available', key: 'available_stock', width: 12 }
    ];

    worksheet.addRows(result.rows);
    
    // Calculate totals
    const totalRemaining = result.rows.reduce((sum, row) => sum + parseInt(row.available_stock || 0), 0);
    const totalValue = result.rows.reduce((sum, row) => {
      const stock = parseInt(row.available_stock || 0);
      const price = parseFloat(row.sell_price || 0);
      return sum + (stock * price);
    }, 0);
    
    // Add summary rows
    worksheet.addRow({});
    worksheet.addRow({
      name: 'TOTAL BOOKS REMAINING:',
      available_stock: totalRemaining
    });
    worksheet.addRow({
      name: 'TOTAL VALUE (at selling price):',
      available_stock: `Rs. ${totalValue.toFixed(2)}`
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const exportSales = async (req, res) => {
  try {
    const { years } = req.query;
    
    let query;
    const params = [];
    
    if (years && years !== '') {
      const yearArray = years.split(',').filter(y => y);
      
      query = `
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          CASE 
            WHEN s.book_condition = 'NEW' THEN bs.year_new
            ELSE bs.year_old
          END as year,
          s.book_condition,
          s.quantity_sold, 
          s.unit_price,
          s.total_bill, 
          s.amount_received, 
          s.payment_status, 
          s.payment_method, 
          s.sell_location, 
          s.profit, 
          s.sold_at
        FROM sales s
        JOIN book_stock bs ON s.stock_id = bs.id
        JOIN books b ON bs.book_id = b.id
        WHERE (
          (s.book_condition = 'NEW' AND bs.year_new = ANY($1))
          OR 
          (s.book_condition = 'OLD' AND bs.year_old = ANY($1))
        )
        ORDER BY s.sold_at DESC
      `;
      params.push(yearArray);
    } else {
      query = `
        SELECT 
          b.name, 
          b.name_urdu, 
          b.ssn,
          CASE 
            WHEN s.book_condition = 'NEW' THEN bs.year_new
            ELSE bs.year_old
          END as year,
          s.book_condition,
          s.quantity_sold, 
          s.unit_price,
          s.total_bill, 
          s.amount_received, 
          s.payment_status, 
          s.payment_method, 
          s.sell_location, 
          s.profit, 
          s.sold_at
        FROM sales s
        JOIN book_stock bs ON s.stock_id = bs.id
        JOIN books b ON bs.book_id = b.id
        ORDER BY s.sold_at DESC
      `;
    }
    
    const result = await pool.query(query, params);
    
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
      { header: 'Method', key: 'payment_method', width: 12 },
      { header: 'Location', key: 'sell_location', width: 20 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Date', key: 'sold_at', width: 20 }
    ];

    worksheet.addRows(result.rows);
    
    // Add yellow background to rows where amount_received is 0
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const amountReceived = parseFloat(row.getCell('amount_received').value || 0);
        if (amountReceived === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' } // Yellow background
            };
          });
        }
      }
    });
    
    const totalSales = result.rows.reduce((sum, row) => sum + parseFloat(row.amount_received || 0), 0);
    const totalProfit = result.rows.reduce((sum, row) => sum + parseFloat(row.profit || 0), 0);
    const additionalIncome = moneyResult.rows
      .filter(m => m.type === 'INCOME')
      .reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
    const additionalExpense = moneyResult.rows
      .filter(m => m.type === 'EXPENSE')
      .reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
    
    worksheet.addRow({});
    worksheet.addRow({ name: 'SALES SUMMARY' });
    worksheet.addRow({ name: 'Total Sales:', total_bill: totalSales.toFixed(2) });
    worksheet.addRow({ name: 'Total Profit:', total_bill: totalProfit.toFixed(2) });
    worksheet.addRow({ name: 'Additional Income:', total_bill: additionalIncome.toFixed(2) });
    worksheet.addRow({ name: 'Additional Expense:', total_bill: additionalExpense.toFixed(2) });
    worksheet.addRow({ name: 'NET TOTAL:', total_bill: (totalSales + additionalIncome - additionalExpense).toFixed(2) });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { exportStock, exportSales };