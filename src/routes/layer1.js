import { Router } from 'express';
import { getLayerTasks } from '../services/layerQueries.js';

const router = Router();

/**
 * @swagger
 * /api/tasks/week:
 *   get:
 *     summary: Get this week's tasks (Layer 1)
 *     tags: [Layers]
 *     parameters:
 *       - in: query
 *         name: focus
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/tasks/week', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : null;

  const tasks = getLayerTasks(1, focusMode);
  res.json({ focusMode: focusMode ?? 0, tasks });
});

export default router;