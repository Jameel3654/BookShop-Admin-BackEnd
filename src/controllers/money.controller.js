const addMoney = async (req, res) => {
  try {
    const { description, amount, type } = req.body;

    if (!description || !amount || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const result = await pool.query(
      'INSERT INTO additional_money (description, amount, type) VALUES ($1, $2, $3) RETURNING *',
      [description, amount, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMoneyRecords = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM additional_money ORDER BY added_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get money error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addMoney, getMoneyRecords };