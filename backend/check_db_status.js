const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cognia',
  password: 'jai@2009',
  port: 5432,
});

async function check() {
  try {
    const res = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('Tables:', res.rows.map(r => r.table_name));
    const creditsRes = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'users\' AND column_name = \'credits\'');
    console.log('Credits Column:', creditsRes.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();
