import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { getRedis } from './config/redis';
import { logger } from './utils/logger';

const PORT = parseInt(process.env['PORT'] || '3000');

async function bootstrap(): Promise<void> {
  await connectDatabase();
  getRedis(); // Initialize Redis connection

  app.listen(PORT, () => {
    logger.info(`🚀 IT HelpDesk API running on http://localhost:${PORT}`);
    logger.info(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
