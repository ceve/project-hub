import { pool } from './db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../migrations/001_init.sql'),
    'utf-8'
  );
  await pool.query(sql);
  console.log('Migrations complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
