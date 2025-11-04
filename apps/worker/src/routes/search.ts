import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VectorSearchService } from '../services/vectorSearch';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const vectorSearch = new VectorSearchService();

// Schema for search request
const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
});

// Search similar documents
router.post('/similar', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID required',
    });
  }

  const validatedData = searchSchema.parse(req.body);

  try {
    // Generate embedding for the search query using direct OpenAI API call
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: validatedData.query,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const queryEmbedding = data.data[0].embedding;

    logger.info('Generated search query embedding successfully');

    // Search for similar documents
    const results = await vectorSearch.searchSimilar(queryEmbedding, {
      limit: validatedData.limit,
      threshold: validatedData.threshold,
      userId,
    });

    res.json({
      success: true,
      query: validatedData.query,
      results,
    });

  } catch (error) {
    logger.error('Error in similarity search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Get document with chunks
router.get('/documents/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID required',
    });
  }

  const { documentId } = req.params;

  try {
    const document = await vectorSearch.getDocumentWithChunks(documentId, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    res.json({
      success: true,
      document,
    });

  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Get user documents
router.get('/documents', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID required',
    });
  }

  const {
    status,
    limit = 50,
    offset = 0,
  } = req.query;

  try {
    const documents = await vectorSearch.getUserDocuments(
      userId,
      status as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      documents,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });

  } catch (error) {
    logger.error('Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Delete document
router.delete('/documents/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID required',
    });
  }

  const { documentId } = req.params;

  try {
    const deleted = await vectorSearch.deleteDocument(documentId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Get document statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID required',
    });
  }

  try {
    const stats = await vectorSearch.getDocumentStats(userId);

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Error fetching document stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

export { router as searchRoutes };