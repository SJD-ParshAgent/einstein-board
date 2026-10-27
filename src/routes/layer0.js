import { Router } from 'express';
import { getLayerTasks } from '../services/layerQueries.js';

const router = Router();

/**
 * @swagger
 * /api/tasks/today:
 *   get:
 *     summary: Get today's tasks (Layer 0)
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
router.get('/tasks/today', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : null;

  const tasks = getLayerTasks(0, focusMode);
  res.json({ focusMode: focusMode ?? 0, tasks });
});

export default router;