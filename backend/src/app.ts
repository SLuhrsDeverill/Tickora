import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { logger } from './utils/logger';

import authRoutes from './modules/auth/auth.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import userRoutes from './modules/users/user.routes';
import assetRoutes from './modules/assets/asset.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import uploadRoutes from './modules/upload/upload.routes';
import chatRoutes from './modules/chat/chat.routes';
import botRoutes from './modules/bot/bot.routes';
import knowledgeRoutes from './modules/knowledge/knowledge.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app = express();

// Security
app.use(helmet());

const ALLOWED_ORIGINS = [
  'https://tickora-frontend.onrender.com',
  'https://tickora.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env['FRONTEND_URL'] ? [process.env['FRONTEND_URL']] : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / curl requests (no origin header)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// Rate limiting
app.use('/api', globalRateLimiter);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorMiddleware);

export default app;
