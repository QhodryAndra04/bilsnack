/* Apply the create_reviews_table.sql migration using the project's DB pool.
   Usage: node server/scripts/apply_reviews_migration.js
   It will read server/models/create_reviews_table.sql and execute its statements.
*/

const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function run() {
  try {
    const sqlPath = path.join(__dirname, '..', 'models', 'create_reviews_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration:', sqlPath);

    // mysql2 will not accept multiple statements by default; split on semicolon while preserving statements.
    // Very simple splitter: split by ";\n" and filter out empty lines. This should work for this migration.
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      console.log('Running statement...');
      await pool.query(stmt);
    }

    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
