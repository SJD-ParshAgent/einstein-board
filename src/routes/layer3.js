import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

// GET /dashboard - Layer 3 (strategic view)
router.get('/dashboard', (req, res) => {
  const db = getDb();
  const focusMode = db.prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0;

  const activeProjects = db.prepare(`
    SELECT COUNT(*) as count FROM projects 
    WHERE type = 'standard' AND stage = 'active'
  `).get().count;

  const totalProjects = db.prepare(`SELECT COUNT(*) as count FROM projects WHERE type = 'standard'`).get().count;

  const upcomingTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE status != 'done' AND due_date <= date('now', '+14 days')
  `).get().count;

  const overdueTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE status != 'done' AND due_date < date('now')
  `).get().count;

  res.json({
    focusMode,
    summary: {
      activeProjects,
      totalProjects,
      upcomingTasks,
      overdueTasks
    }
  });
});

export default router;