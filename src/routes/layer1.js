import { Router } from 'express';
import { getLayerTasks } from '../services/layerQueries.js';

const router = Router();

router.get('/tasks/week', (req, res) => {
  const focusMode = req.query.focus !== undefined 
    ? parseInt(req.query.focus, 10) 
    : null;

  const tasks = getLayerTasks(1, focusMode);
  res.json({ focusMode: focusMode ?? 0, tasks });
});

export default router;