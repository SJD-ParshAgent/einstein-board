import { Router } from 'express';
import { getCurrentFocusMode } from '../services/settings.js';

const router = Router();

// GET /dashboard - Layer 3 (strategic view)
router.get('/dashboard', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : getCurrentFocusMode();

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