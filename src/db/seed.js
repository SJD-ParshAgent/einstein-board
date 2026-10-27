#!/usr/bin/env node
import Database from 'better-sqlite3';
import 'dotenv/config';

const dbPath = process.env.DB_PATH || './einstein-board.db';
const db = new Database(dbPath);

console.log('Seeding stable projects...');

// These are already created by schema.sql, but we can add more seed data here later
const count = db.prepare('SELECT COUNT(*) as count FROM projects WHERE type = ?').get('stable');
console.log(`Stable projects present: ${count.count}`);

db.close();
console.log('✅ Seed complete');