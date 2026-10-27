import { getDb } from '../db/index.js';

export function completeTask(taskId) {
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) throw new Error('Task not found');

  const now = new Date().toISOString();

  // Mark current task as done
  db.prepare(`
    UPDATE tasks 
    SET status = 'done', completed_at = ?, last_completed_at = ?
    WHERE id = ?
  `).run(now, now, taskId);

  // If not recurring, we're done
  if (!task.is_recurring) {
    return { completed: taskId, newTask: null };
  }

  // Create next instance
  let nextDue = null;

  if (task.recurrence_type === 'fixed') {
    // Fixed: use cron/next occurrence logic (simplified for now)
    // In real version we'd use a cron parser
    nextDue = task.next_due_date; // placeholder
  } else if (task.recurrence_type === 'rolling') {
    // Rolling: add interval to last_completed_at
    const interval = task.recurrence_rule; // e.g. "7d", "2w"
    // Simple parser for demo
    const match = interval.match(/(\d+)([dwm])/);
    if (match) {
      const num = parseInt(match[1]);
      const unit = match[2];
      const days = unit === 'd' ? num : unit === 'w' ? num * 7 : num * 30;
      const base = task.last_completed_at ? new Date(task.last_completed_at) : new Date();
      base.setDate(base.getDate() + days);
      nextDue = base.toISOString().split('T')[0];
    }
  }

  if (nextDue) {
    const newTask = db.prepare(`
      INSERT INTO tasks (
        project_id, title, status, notes, due_date, pinned_today,
        is_recurring, recurrence_type, recurrence_rule, next_due_date, sort_order
      ) VALUES (?, ?, 'todo', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.project_id,
      task.title,
      task.notes,
      nextDue,
      task.pinned_today,
      1,
      task.recurrence_type,
      task.recurrence_rule,
      nextDue,
      task.sort_order
    );

    return { completed: taskId, newTask: newTask.lastInsertRowid };
  }

  return { completed: taskId, newTask: null };
}
