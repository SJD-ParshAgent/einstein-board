import express from 'express';
import 'dotenv/config';
import { getDb } from './db/index.js';

const app = express();
const port = process.env.PORT || 3456;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', focusMode: getDb().prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0 });
});

// TODO: Layer 0, 1, 2 routes will go here

app.listen(port, () => {
  console.log(`Einstein Board running on port ${port}`);
});