import { Router, Request, Response } from 'express';
import { redisConnection } from '../services/queue';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check Redis connection
    const redisStatus = await checkRedisHealth();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
        server: 'healthy'
      }
    };

    const statusCode = redisStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Check Redis connection
    const redisStatus = await checkRedisHealth();
    const redisResponseTime = Date.now() - startTime;

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // Uptime
    const uptime = process.uptime();

    const healthDetails = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      services: {
        redis: {
          ...redisStatus,
          responseTime: `${redisResponseTime}ms`
        },
        server: {
          status: 'healthy',
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          }
        }
      }
    };

    const statusCode = redisStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthDetails);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function checkRedisHealth() {
  try {
    const startTime = Date.now();
    await redisConnection.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      host: redisConnection.options.host,
      port: redisConnection.options.port
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      host: redisConnection.options.host,
      port: redisConnection.options.port
    };
  }
}

export { router as healthRoutes };