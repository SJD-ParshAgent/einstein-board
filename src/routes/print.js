import { Router } from 'express';
import { spawn } from 'child_process';
import { getDb } from '../db/index.js';

const router = Router();

const PRINTER_SCRIPT = process.env.PRINTER_SCRIPT_PATH;

// POST /print/today
router.post('/print/today', async (req, res) => {
  if (!PRINTER_SCRIPT) {
    return res.status(400).json({ success: false, error: 'Printer script path not configured' });
  }

  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, p.title as project_title 
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.status != 'done' AND (t.due_date <= date('now') OR t.pinned_today = 1)
    ORDER BY t.sort_order
  `).all();

  const python = spawn('python3', [
    `${PRINTER_SCRIPT}/work/print_checklist.py`,
    JSON.stringify(tasks)
  ]);

  python.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, printed: tasks.length });
    } else {
      res.status(500).json({ success: false, error: 'Printer failed' });
    }
  });
});

export default router;