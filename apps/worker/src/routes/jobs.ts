import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getQueue, addDocumentProcessingJob, getJobStatus } from '../services/queue';
import { logger } from '../utils/logger';
import { validateFileInfo, sanitizeFilename, generateJobId, formatFileSize, estimateProcessingTime } from '../utils/fileUtils';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Schema for job creation
const createJobSchema = z.object({
  type: z.enum(['pdf', 'markdown']),
  filename: z.string().min(1),
  content: z.string().min(1), // Base64 encoded content
  userId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

// Create a new document processing job
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createJobSchema.parse(req.body);

  // Decode base64 content
  const content = Buffer.from(validatedData.content, 'base64');

  // Validate file info
  const fileInfo = validateFileInfo(content, validatedData.filename);
  const sanitizedFilename = sanitizeFilename(validatedData.filename);

  // Generate job ID
  const jobId = generateJobId();

  // Estimate processing time
  const estimatedTime = estimateProcessingTime(content.length, fileInfo.type);

  logger.info(`Validated file: ${sanitizedFilename} (${formatFileSize(content.length)})`);

  // Add job to queue
  const job = await addDocumentProcessingJob({
    type: fileInfo.type,
    filename: sanitizedFilename,
    content,
    userId: validatedData.userId,
    metadata: {
      ...validatedData.metadata,
      originalFilename: validatedData.filename,
      mimeType: fileInfo.mimeType,
      estimatedProcessingTime: estimatedTime,
    },
  });

  logger.info(`Created job ${job.id} for user ${validatedData.userId}`);

  res.status(201).json({
    success: true,
    jobId: job.id,
    status: 'pending',
    estimatedProcessingTime: `${estimatedTime}s`,
    fileInfo: {
      filename: sanitizedFilename,
      size: fileInfo.size,
      type: fileInfo.type,
      mimeType: fileInfo.mimeType,
    },
    message: 'Job added to queue successfully',
  });
}));

// Get job status
router.get('/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const jobStatus = await getJobStatus(jobId);

  if (!jobStatus) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  res.json({
    success: true,
    job: jobStatus,
  });
}));

// Get queue statistics
router.get('/stats/queue', asyncHandler(async (req: Request, res: Response) => {
  const queue = getQueue();

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
  ]);

  const stats = {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    total: waiting.length + active.length + completed.length + failed.length,
  };

  res.json({
    success: true,
    stats,
  });
}));

// Cancel a job
router.delete('/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const queue = getQueue();

  const job = await queue.getJob(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  await job.remove();

  logger.info(`Cancelled job ${jobId}`);

  res.json({
    success: true,
    message: 'Job cancelled successfully',
  });
}));

// Retry a failed job
router.post('/:jobId/retry', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const queue = getQueue();

  const job = await queue.getJob(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  const state = await job.getState();
  if (state !== 'failed') {
    return res.status(400).json({
      success: false,
      error: 'Only failed jobs can be retried',
    });
  }

  await job.retry();

  logger.info(`Retried job ${jobId}`);

  res.json({
    success: true,
    message: 'Job queued for retry',
  });
}));

export { router as jobRoutes };