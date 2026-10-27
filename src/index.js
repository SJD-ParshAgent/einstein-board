import express from 'express';
import 'dotenv/config';
import { getDb } from './db/index.js';
import layer0Router from './routes/layer0.js';
import layer1Router from './routes/layer1.js';

const app = express();
const port = process.env.PORT || 3456;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', focusMode: getDb().prepare('SELECT focus_mode FROM settings WHERE id = 1').get()?.focus_mode ?? 0 });
});

app.use('/api', layer0Router);
app.use('/api', layer1Router);

app.listen(port, () => {
  console.log(`Einstein Board running on port ${port}`);
});