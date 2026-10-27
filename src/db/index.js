import Database from 'better-sqlite3';
import 'dotenv/config';

const dbPath = process.env.DB_PATH || './einstein-board.db';

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}