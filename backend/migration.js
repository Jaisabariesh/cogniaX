const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cognia',
  password: 'jai@2009',
  port: 5432,
});

const migrationQuery = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    credits NUMERIC(10,4) DEFAULT 50.0000,
    last_credit_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade existing credits column if it's integer
DO $$ 
BEGIN 
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='users' AND column_name='credits') = 'integer' THEN
        ALTER TABLE users ALTER COLUMN credits TYPE NUMERIC(10,4);
    END IF;
END $$;

-- Vaults Table
CREATE TABLE IF NOT EXISTS vaults (
    id SERIAL PRIMARY KEY,
    uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders Table
CREATE TABLE IF NOT EXISTS folders (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES vaults(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order BIGINT DEFAULT 0,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to notes if it already exists
DO $$ 
BEGIN 
    -- Ensure notes table exists
    CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add vault_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='vault_id') THEN
        ALTER TABLE notes ADD COLUMN vault_id INTEGER REFERENCES vaults(id) ON DELETE CASCADE;
    END IF;

    -- Add folder_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='folder_id') THEN
        ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE;
    END IF;

    -- Add sort_order
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='sort_order') THEN
        ALTER TABLE notes ADD COLUMN sort_order BIGINT DEFAULT 0;
    END IF;
END $$;

-- Credit Transactions Table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id SERIAL PRIMARY KEY,
    uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
    amount_credits INTEGER NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure indexes
CREATE INDEX IF NOT EXISTS idx_folders_vault_id ON folders(vault_id);
CREATE INDEX IF NOT EXISTS idx_notes_vault_id ON notes(vault_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
`;

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    await pool.query(migrationQuery);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
