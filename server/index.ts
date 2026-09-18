import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import path from 'path';
import pool from './db/pool';
import usersRouter from './routes/users';
import postsRouter from './routes/posts';
import followsRouter from './routes/follows';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://instameow.app',
    'https://instawoof.app',
    'https://pawprintsnetwork.com',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/follows', followsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist/client');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Pawprint Network server running on port ${PORT}`);
});

export default app;
