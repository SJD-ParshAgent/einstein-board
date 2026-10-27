import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

// GET /tasks/week - Layer 1
router.get('/tasks/week', (req, res) => {
  const db = getDb();
  const focusMode = db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0;

  let tasks;

  if (focusMode) {
    // Focus mode: active projects + stable + exceptions, due within 7 days
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
        AND t.due_date <= date('now', '+7 days')
      ORDER BY t.due_date, t.sort_order
    `).all();
  } else {
    // Normal mode: all tasks due within 7 days
    tasks = db.prepare(`
      SELECT t.*, p.title as project_title
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.status != 'done'
        AND t.due_date <= date('now', '+7 days')
      ORDER BY t.due_date, t.sort_order
    `).all();
  }

  res.json({ focusMode, tasks });
});

export default router;