import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

// GET /projects - Layer 2 (project list)
router.get('/projects', (req, res) => {
  const db = getDb();
  const focusMode = db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0;

  let projects;

  if (focusMode) {
    // Focus mode: only active standard projects + stable projects
    projects = db.prepare(`
      SELECT * FROM projects 
      WHERE (type = 'stable')
         OR (type = 'standard' AND stage = 'active')
      ORDER BY sort_order, title
    `).all();
  } else {
    projects = db.prepare(`
      SELECT * FROM projects 
      ORDER BY 
        CASE type WHEN 'stable' THEN 0 ELSE 1 END,
        CASE stage 
          WHEN 'active' THEN 0 
          WHEN 'on-deck' THEN 1 
          WHEN 'holding' THEN 2 
          WHEN 'graveyard' THEN 3 
          ELSE 4 
        END,
        sort_order, title
    `).all();
  }

  res.json({ focusMode, projects });
});

export default router;