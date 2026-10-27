import { getDb } from '../db/index.js';

export function getCurrentFocusMode() {
  const db = getDb();
  return db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0;
}
