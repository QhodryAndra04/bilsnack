/*
  migrate_and_check_in_stock.js
  - Runs the add_in_stock migration (from file) against the DB configured in .env
  - Verifies the `in_stock` column exists and optionally updates existing rows.

  Usage: node server/scripts/migrate_and_check_in_stock.js
*/

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const sqlPath = path.resolve(__dirname, '..', 'models', 'add_in_stock_migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'billsnack',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'billsnack',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  const conn = await pool.getConnection();
  try {
    console.log('Running migration script...');
    // the migration script uses prepared statements; allow multiple statements if needed
    await conn.query('SET SESSION sql_mode = ""');
    // execute the script chunk by chunk to avoid client issues with multiple statements
    const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const s of stmts) {
      console.log('> Executing:', s.split('\n')[0].slice(0, 120));
      try {
        await conn.query(s);
      } catch (err) {
        console.warn('  (warn) statement failed:', err.message);
      }
    }

    console.log('Checking whether `in_stock` column exists...');
    const [cols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'in_stock'");
    if (cols.length > 0) {
      console.log('OK: in_stock column present');
    } else {
      console.error('ERROR: in_stock column not found after migration');
      process.exitCode = 2;
    }

    console.log('Sample: showing id, name, stock, in_stock for up to 5 products');
    const [rows] = await conn.query('SELECT id, name, stock, in_stock FROM products ORDER BY id DESC LIMIT 5');
    console.table(rows);

    console.log('Optional: set in_stock from stock for rows where in_stock is NULL or missing');
    const [r2] = await conn.query("UPDATE products SET in_stock = CASE WHEN stock > 0 THEN 1 ELSE 0 END WHERE in_stock IS NULL OR in_stock = ''");
    console.log('Updated rows count:', r2.affectedRows || 0);

  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
