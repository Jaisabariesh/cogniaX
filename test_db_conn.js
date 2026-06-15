const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cognia',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function testConnection() {
  try {
    console.log('Testing connection with password:', process.env.DB_PASSWORD ? 'PROVIDED' : 'MISSING');
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
