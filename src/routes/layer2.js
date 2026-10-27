import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getCurrentFocusMode } from '../services/settings.js';

const router = Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get projects list (Layer 2)
 *     tags: [Layers]
 *     parameters:
 *       - in: query
 *         name: focus
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of projects
 */

// GET /projects - Layer 2 (project list)
router.get('/projects', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : getCurrentFocusMode();

  let projects;

  const db = getDb();

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