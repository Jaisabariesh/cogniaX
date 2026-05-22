const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cognia',
  password: 'jai@2009',
  port: 5432,
});

async function check() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  fs.writeFileSync('db_status.txt', JSON.stringify(res.rows, null, 2));
  await pool.end();
}
check();
