import 'dotenv/config';
import { pool } from '../src/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '../migrations/create_audit_logs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration successful: audit_logs table created.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
