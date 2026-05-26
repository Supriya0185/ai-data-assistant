import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';

import healthRouter from './routes/health';
import datasetsRouter from './routes/datasets';
import chatRouter from './routes/chat';
import queryRouter from './routes/query';
import mcpRouter from './routes/mcp';
import exportRouter from './routes/export';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './services/logger';

// ── Ensure logs directory exists ──────────────────────────────
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── App Setup ─────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env['PORT'] ?? 3001);

// ── Security & Parsing ────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:3000',
      'http://localhost:4173',  // Vite preview
    ],
    credentials: true,
    exposedHeaders: ['x-session-id'],
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    limits: {
      fileSize: Number(process.env['MAX_FILE_SIZE_MB'] ?? 50) * 1024 * 1024,
    },
    abortOnLimit: true,
    createParentPath: true,
  })
);

// ── Routes ────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/datasets', datasetsRouter);
app.use('/chat', chatRouter);
app.use('/query', queryRouter);
app.use('/mcp', mcpRouter);
app.use('/export', exportRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 DataPilot backend running on http://localhost:${PORT}`);
  logger.info(`   Anthropic key: ${process.env['ANTHROPIC_API_KEY'] ? '✅ set' : '❌ MISSING'}`);
  logger.info(`   Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
});

export default app;
