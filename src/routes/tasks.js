import { Router } from 'express';
import { getDb } from '../db/index.js';
import { completeTask } from '../services/recurrence.js';

const router = Router();

// POST /tasks
router.post('/tasks', (req, res) => {
  const { project_id, title, due_date, pinned_today, notes, is_recurring, recurrence_type, recurrence_rule } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ error: 'project_id and title are required' });
  }

  const db = getDb();

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, due_date, pinned_today, notes, is_recurring, recurrence_type, recurrence_rule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project_id,
    title,
    due_date || null,
    pinned_today ? 1 : 0,
    notes || null,
    is_recurring ? 1 : 0,
    recurrence_type || null,
    recurrence_rule || null
  );

  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newTask);
});

// PATCH /tasks/:id
router.patch('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const fields = [];
  const values = [];

  const allowed = ['title', 'due_date', 'pinned_today', 'notes', 'status', 'sort_order'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(taskId);

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.json(updated);
});

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