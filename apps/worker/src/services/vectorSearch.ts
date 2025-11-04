import { db } from '@repo/db';
import { documentChunks, documents } from '@repo/db/schema';
import { eq, and, cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface SearchResult {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  chunkText: string;
  similarityScore: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  userId?: string;
}

export class VectorSearchService {
  private readonly defaultLimit = 10;
  private readonly defaultThreshold = 0.7;

  /**
   * Search for similar documents based on embedding vector
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { limit = this.defaultLimit, threshold = this.defaultThreshold, userId } = options;

    try {
      logger.info(`Searching for similar documents with threshold ${threshold} and limit ${limit}`);

      const query = db
        .select({
          documentId: documents.id,
          documentName: documents.filename,
          chunkIndex: documentChunks.chunkIndex,
          chunkText: documentChunks.text,
          similarityScore: 1 - cosineDistance(documentChunks.embeddingVector, queryEmbedding),
        })
        .from(documentChunks)
        .innerJoin(documents, eq(documentChunks.documentId, documents.id))
        .where(
          and(
            gt(
              1 - cosineDistance(documentChunks.embeddingVector, queryEmbedding),
              threshold
            ),
            userId ? eq(documents.userId, userId) : sql`true`,
            eq(documents.status, 'completed')
          )
        )
        .orderBy(desc(1 - cosineDistance(documentChunks.embeddingVector, queryEmbedding)))
        .limit(limit);

      const results = await query;

      logger.info(`Found ${results.length} similar documents`);

      return results.map(result => ({
        documentId: result.documentId,
        documentName: result.documentName,
        chunkIndex: result.chunkIndex,
        chunkText: result.chunkText,
        similarityScore: Number(result.similarityScore),
      }));

    } catch (error) {
      logger.error('Error in vector similarity search:', error);
      throw error;
    }
  }

  /**
   * Get document by ID with all its chunks
   */
  async getDocumentWithChunks(documentId: string, userId?: string): Promise<{
    id: string;
    filename: string;
    contentType: string;
    status: string;
    storagePath: string | null;
    userId: string;
    createdAt: Date;
    chunks: Array<{
      chunkIndex: number;
      text: string;
    }>;
  } | null> {
    try {
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          userId ? eq(documents.userId, userId) : sql`true`
        ),
        with: {
          chunks: {
            orderBy: documentChunks.chunkIndex,
            columns: {
              chunkIndex: true,
              text: true,
            },
          },
        },
      });

      if (!document) {
        return null;
      }

      return {
        id: document.id,
        filename: document.filename,
        contentType: document.contentType,
        status: document.status,
        storagePath: document.storagePath || null,
        userId: document.userId,
        createdAt: document.createdAt,
        chunks: document.chunks,
      };

    } catch (error) {
      logger.error('Error fetching document with chunks:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(
    userId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{
    id: string;
    filename: string;
    contentType: string;
    status: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      const query = db
        .select({
          id: documents.id,
          filename: documents.filename,
          contentType: documents.contentType,
          status: documents.status,
          size: documents.size,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .where(
          and(
            eq(documents.userId, userId),
            status ? eq(documents.status, status) : sql`true`
          )
        )
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset);

      return await query;

    } catch (error) {
      logger.error('Error fetching user documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      // First check if the document belongs to the user
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ),
      });

      if (!document) {
        return false;
      }

      // Delete the document (chunks will be deleted due to CASCADE)
      await db.delete(documents).where(eq(documents.id, documentId));

      logger.info(`Deleted document ${documentId}`);
      return true;

    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(userId: string): Promise<{
    totalDocuments: number;
    completedDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
    totalChunks: number;
  }> {
    try {
      const stats = await db
        .select({
          totalDocuments: sql<number>`count(*)`.mapWith(Number),
          completedDocuments: sql<number>`count(*) filter (where status = 'completed')`.mapWith(Number),
          processingDocuments: sql<number>`count(*) filter (where status = 'processing')`.mapWith(Number),
          failedDocuments: sql<number>`count(*) filter (where status = 'failed')`.mapWith(Number),
        })
        .from(documents)
        .where(eq(documents.userId, userId));

      const totalChunksQuery = await db
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(documentChunks)
        .innerJoin(documents, eq(documentChunks.documentId, documents.id))
        .where(eq(documents.userId, userId));

      return {
        totalDocuments: stats[0]?.totalDocuments || 0,
        completedDocuments: stats[0]?.completedDocuments || 0,
        processingDocuments: stats[0]?.processingDocuments || 0,
        failedDocuments: stats[0]?.failedDocuments || 0,
        totalChunks: totalChunksQuery[0]?.count || 0,
      };

    } catch (error) {
      logger.error('Error fetching document stats:', error);
      throw error;
    }
  }
}