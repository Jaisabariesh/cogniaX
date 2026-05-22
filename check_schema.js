const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cognia',
  password: 'jai@2009',
  port: 5432,
});

async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notes'");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
check();
