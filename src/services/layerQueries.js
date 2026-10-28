import { getDb } from '../db/index.js';

export function getLayerTasks(layer, focusMode = null) {
  const db = getDb();

  if (focusMode === null) {
    const row = db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get();
    focusMode = row?.focus_mode ?? 0;
  }

  const isFocus = focusMode === 1;
  const dateFilter = layer === 0 
    ? `t.due_date <= date('now', 'localtime') OR t.pinned_today = 1`
    : `t.due_date <= date('now', 'localtime', '+7 days')`;

  const orderBy = layer === 0 
    ? `t.sort_order, t.due_date`
    : `t.due_date, t.sort_order`;

  let whereFocus = '';
  if (isFocus) {
    whereFocus = `
      AND (
        p.type = 'stable' 
        OR (p.type = 'standard' AND p.stage = 'active')
      )
    `;
  }

  const sql = `
    SELECT t.*, p.title as project_title
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.status != 'done'
      AND (${dateFilter})
      ${whereFocus}
    ORDER BY ${orderBy}
  `;

  return db.prepare(sql).all();
}
