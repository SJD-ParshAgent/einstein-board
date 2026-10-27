import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

// GET /tasks/today - Layer 0
router.get('/tasks/today', (req, res) => {
  const db = getDb();
  const focusMode = db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0;

  let tasks;

  if (focusMode) {
    // Focus mode: only tasks from active projects + stable projects + exceptions
    tasks = db.prepare(`
      SELECT t.*, p.title as project_title, p.focus, p.einstein_exception
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.status != 'done'
        AND (
          p.type = 'stable'
          OR (p.type = 'standard' AND p.stage = 'active')
          OR (p.einstein_exception = 1)
        )
        AND (t.due_date <= date('now') OR t.pinned_today = 1)
      ORDER BY t.sort_order, t.due_date
    `).all();
  } else {
    // Normal mode: all pinned_today + due today
    tasks = db.prepare(`
      SELECT t.*, p.title as project_title
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.status != 'done'
        AND (t.due_date <= date('now') OR t.pinned_today = 1)
      ORDER BY t.sort_order, t.due_date
    `).all();
  }

  res.json({ focusMode, tasks });
});

export default router;