import { pool } from '../src/db';
import fs from 'fs';
import path from 'path';

export async function setupTestDb() {
  const migration = fs.readFileSync(
    path.join(__dirname, '../migrations/001_init.sql'),
    'utf-8'
  );
  await pool.query(migration);
}

export async function cleanDb() {
  await pool.query('DELETE FROM comments');
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM users');
}

export async function teardownTestDb() {
  await pool.end();
}
