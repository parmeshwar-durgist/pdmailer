const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_mailer_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${process.env.DB_NAME || 'hr_mailer_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] MySQL Connection Error:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};

