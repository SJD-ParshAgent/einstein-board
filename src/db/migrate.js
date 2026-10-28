#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || './einstein-board.db';
const schemaPath = join(__dirname, '../../schema.sql');

const TARGET_VERSION = 2;

console.log(`Running migrations on ${dbPath}...`);

const db = new Database(dbPath);
const currentVersion = db.pragma('user_version', { simple: true });

console.log(`Current schema version: ${currentVersion}, target: ${TARGET_VERSION}`);

if (currentVersion >= TARGET_VERSION) {
  console.log('✅ Schema already up to date');
  db.close();
  process.exit(0);
}

// For v2 we need a full rebuild because of CHECK constraint changes
if (currentVersion === 0) {
  console.log('Applying fresh v2 schema...');
  const schema = readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  db.pragma(`user_version = ${TARGET_VERSION}`);
  console.log('✅ Schema v2 applied');
} else {
  console.log('Migration path not yet implemented for incremental upgrades');
  // Future: add incremental migration steps here
}

db.close();