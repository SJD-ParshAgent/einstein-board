import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getCurrentFocusMode } from '../services/settings.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard overview (Layer 3)
 *     tags: [Layers]
 *     parameters:
 *       - in: query
 *         name: focus
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard summary
 */

// GET /dashboard - Layer 3 (strategic view)
router.get('/dashboard', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : getCurrentFocusMode();

  const db = getDb();

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