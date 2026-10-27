import express from 'express';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import { getDb } from './db/index.js';
import { getCurrentFocusMode } from './services/settings.js';
import layer0Router from './routes/layer0.js';
import layer1Router from './routes/layer1.js';
import layer2Router from './routes/layer2.js';
import layer3Router from './routes/layer3.js';
import printRouter from './routes/print.js';
import tasksRouter from './routes/tasks.js';

const app = express();
const port = process.env.PORT || 3456;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', focusMode: getCurrentFocusMode() });
});

app.use('/api', layer0Router);
app.use('/api', layer1Router);
app.use('/api', layer2Router);
app.use('/api', layer3Router);
app.use('/api', printRouter);
app.use('/api', tasksRouter);

// Swagger UI
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Einstein Board API',
    version: '0.1.0',
    description: 'Focused task management based on the Einstein Principle'
  },
  servers: [{ url: 'http://localhost:3456' }]
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Einstein Board running on port ${port}`);
});