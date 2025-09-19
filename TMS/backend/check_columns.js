const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function checkColumns() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'transportation_management',
  });

  try {
    const [columns] = await pool.query('DESCRIBE Customer');
    console.log(`Total columns: ${columns.length}`);
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
