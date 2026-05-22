const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cognia',
  password: 'jai@2009',
  port: 5432,
});

async function patchDatabase() {
  try {
    console.log('🚀 Patching database columns...');
    
    await pool.query('ALTER TABLE folders ALTER COLUMN sort_order TYPE BIGINT;');
    console.log('✅ Updated folders.sort_order to BIGINT');
    
    await pool.query('ALTER TABLE notes ALTER COLUMN sort_order TYPE BIGINT;');
    console.log('✅ Updated notes.sort_order to BIGINT');
    
    console.log('🎉 Patching completed successfully!');
  } catch (err) {
    console.error('❌ Patching failed:', err.message);
  } finally {
    await pool.end();
  }
}

patchDatabase();
