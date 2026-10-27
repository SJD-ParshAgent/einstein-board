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

console.log(`Running migrations on ${dbPath}...`);

const db = new Database(dbPath);
const schema = readFileSync(schemaPath, 'utf8');

db.exec(schema);

console.log('✅ Schema applied successfully');
db.close();