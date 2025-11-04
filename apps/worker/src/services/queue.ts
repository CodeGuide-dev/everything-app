import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
};

// Create Redis connection
export const redisConnection = new IORedis(redisConfig);

redisConnection.on('connect', () => {
  logger.info('Redis connection established');
});

redisConnection.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Worker configuration
export const workerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
};

// Create queue instance
export const documentProcessingQueue = new Queue('document-processing', queueOptions);

// Job types
export type DocumentProcessingJob = {
  type: 'pdf' | 'markdown';
  filename: string;
  content: Buffer;
  userId: string;
  metadata?: Record<string, any>;
};

// Create and setup queue
export async function createQueue(): Promise<Queue> {
  try {
    // Test connection
    await redisConnection.ping();
    logger.info('Queue created successfully');
    return documentProcessingQueue;
  } catch (error) {
    logger.error('Failed to create queue:', error);
    throw error;
  }
}

// Get queue instance
export function getQueue(): Queue {
  return documentProcessingQueue;
}

// Add job to queue
export async function addDocumentProcessingJob(
  jobData: DocumentProcessingJob,
  options?: { delay?: number; priority?: number }
) {
  try {
    const job = await documentProcessingQueue.add(
      'process-document',
      jobData,
      options
    );
    logger.info(`Added job ${job.id} to queue for document: ${jobData.filename}`);
    return job;
  } catch (error) {
    logger.error('Failed to add job to queue:', error);
    throw error;
  }
}

// Get job status
export async function getJobStatus(jobId: string) {
  try {
    const job = await documentProcessingQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      result,
      failedReason,
      data: job.data,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error('Failed to get job status:', error);
    throw error;
  }
}
