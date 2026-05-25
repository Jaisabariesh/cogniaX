const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cognia',
  password: process.env.DB_PASSWORD || 'jai@2009',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function run() {
  try {
    console.log('🚀 Changing credits column type to NUMERIC(10, 4)...');
    await pool.query('ALTER TABLE users ALTER COLUMN credits TYPE NUMERIC(10, 4);');
    console.log('✅ Credits column updated!');
    
    console.log('🚀 Updating credit_transactions table too...');
    await pool.query('ALTER TABLE credit_transactions ALTER COLUMN amount_credits TYPE NUMERIC(10, 4);');
    console.log('✅ Transactions column updated!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
