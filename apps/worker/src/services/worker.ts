import { Worker, Job } from 'bullmq';
import { DocumentProcessor } from './documentProcessor';
import { redisConnection, workerOptions } from './queue';
import { logger } from '../utils/logger';
import type { DocumentProcessingJob } from './queue';

const documentProcessor = new DocumentProcessor();

export async function setupWorker(): Promise<Worker> {
  const worker = new Worker(
    'document-processing',
    async (job: Job<DocumentProcessingJob>) => {
      await processDocumentJob(job);
    },
    workerOptions
  );

  worker.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed with result:`, result);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  return worker;
}

async function processDocumentJob(job: Job<DocumentProcessingJob>) {
  const { type, filename, content, userId, metadata } = job.data;

  try {
    logger.info(`Starting to process job ${job.id}: ${filename}`);

    // Update job progress
    await job.updateProgress(10);

    // Process the document
    const result = await documentProcessor.processDocument(job.data);

    // Update job progress
    await job.updateProgress(100);

    logger.info(`Job ${job.id} completed successfully:`, result);

    return {
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
    };

  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);

    // Update job progress to indicate failure
    await job.updateProgress({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

export { documentProcessor };