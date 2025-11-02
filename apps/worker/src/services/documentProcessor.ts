import pdf from 'pdf-parse';
import { marked } from 'marked';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@repo/db';
import { documents, documentChunks } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import type { DocumentProcessingJob } from './queue';

export interface DocumentChunk {
  text: string;
  embedding: number[];
}

export class DocumentProcessor {
  private readonly chunkSize = 1000; // characters
  private readonly chunkOverlap = 200; // characters

  async processDocument(jobData: DocumentProcessingJob): Promise<{
    documentId: string;
    chunksProcessed: number;
  }> {
    const { type, filename, content, userId, metadata } = jobData;

    try {
      logger.info(`Processing ${type} document: ${filename}`);

      // Extract text content
      let text: string;
      if (type === 'pdf') {
        const pdfData = await pdf(content);
        text = pdfData.text;
      } else if (type === 'markdown') {
        text = content.toString('utf-8');
      } else {
        throw new Error(`Unsupported document type: ${type}`);
      }

      // Create document record
      const [document] = await db.insert(documents)
        .values({
          filename,
          contentType: type,
          size: content.length,
          status: 'processing',
          userId,
          metadata: metadata || {},
        })
        .returning();

      logger.info(`Created document record: ${document.id}`);

      // Update document status to processing
      await db.update(documents)
        .set({ status: 'processing' })
        .where(eq(documents.id, document.id));

      // Split text into chunks
      const chunks = this.splitTextIntoChunks(text);
      logger.info(`Split document into ${chunks.length} chunks`);

      // Process chunks in batches to generate embeddings
      const processedChunks: DocumentChunk[] = [];
      const batchSize = 10; // Process 10 chunks at a time

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchEmbeddings = await this.generateEmbeddings(batch);

        processedChunks.push(...batchEmbeddings);

        // Save batch to database
        await this.saveChunksToDatabase(document.id, batchEmbeddings, i);

        logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      }

      // Update document status to completed
      await db.update(documents)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, document.id));

      logger.info(`Successfully processed document: ${document.id}`);

      return {
        documentId: document.id,
        chunksProcessed: processedChunks.length,
      };

    } catch (error) {
      logger.error(`Error processing document ${filename}:`, error);

      // Try to update document status to failed if we have a document record
      try {
        const existingDoc = await db.select()
          .from(documents)
          .where(eq(documents.filename, filename))
          .limit(1);

        if (existingDoc.length > 0) {
          await db.update(documents)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(documents.id, existingDoc[0].id));
        }
      } catch (updateError) {
        logger.error('Failed to update document status to failed:', updateError);
      }

      throw error;
    }
  }

  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      if (end >= text.length) {
        chunks.push(text.slice(start));
        break;
      }

      // Try to find a good breaking point (paragraph, sentence, or space)
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start && paragraphBreak > end - 200) {
        end = paragraphBreak + 2;
      } else {
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start && sentenceBreak > end - 100) {
          end = sentenceBreak + 2;
        } else {
          const spaceBreak = text.lastIndexOf(' ', end);
          if (spaceBreak > start) {
            end = spaceBreak + 1;
          }
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = Math.max(start + 1, end - this.chunkOverlap);
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  private async generateEmbeddings(chunks: string[]): Promise<DocumentChunk[]> {
    try {
      const embeddingModel = openai.embedding('text-embedding-3-small');

      // Generate embeddings for all chunks in parallel
      const { embeddings } = await embed({
        model: embeddingModel,
        values: chunks,
      });

      return chunks.map((text, index) => ({
        text,
        embedding: embeddings[index],
      }));
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw error;
    }
  }

  private async saveChunksToDatabase(
    documentId: string,
    chunks: DocumentChunk[],
    startIndex: number
  ): Promise<void> {
    try {
      const chunkRecords = chunks.map((chunk, index) => ({
        documentId,
        chunkIndex: startIndex + index,
        text: chunk.text,
        embeddingVector: chunk.embedding,
      }));

      await db.insert(documentChunks).values(chunkRecords);
    } catch (error) {
      logger.error('Error saving chunks to database:', error);
      throw error;
    }
  }
}