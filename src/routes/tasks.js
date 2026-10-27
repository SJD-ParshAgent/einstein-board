import { Router } from 'express';
import { getDb } from '../db/index.js';
import { completeTask } from '../services/recurrence.js';

const router = Router();

// POST /tasks/:id/complete
router.post('/tasks/:id/complete', (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const result = completeTask(taskId);
    res.json({ 
      success: true, 
      completed: result.completed,
      newTaskId: result.newTask 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;