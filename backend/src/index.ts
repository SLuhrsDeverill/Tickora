import 'dotenv/config';
import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { getRedis } from './config/redis';
import { logger } from './utils/logger';
import { initSocket } from './config/socket';

const PORT = parseInt(process.env['PORT'] || '3000');

async function bootstrap(): Promise<void> {
  await connectDatabase();
  getRedis(); // Initialize Redis connection (best-effort)

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Tickora API running on http://localhost:${PORT}`);
    logger.info(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
