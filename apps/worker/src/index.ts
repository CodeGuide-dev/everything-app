import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createQueue } from './services/queue';
import { setupWorker } from './services/worker';
import { jobRoutes } from './routes/jobs';
import { healthRoutes } from './routes/health';
import { searchRoutes } from './routes/search';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/health', healthRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/search', searchRoutes);

// Error handling
app.use(errorHandler);

// Initialize BullMQ queue and worker
async function initializeServices() {
  try {
    const queue = await createQueue();
    logger.info('BullMQ queue initialized successfully');

    const worker = await setupWorker();
    logger.info('BullMQ worker initialized successfully');

    return { queue, worker };
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();

    app.listen(PORT, () => {
      logger.info(`Worker service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();