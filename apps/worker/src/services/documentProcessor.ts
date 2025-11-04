import pdf from 'pdf-parse';
import { marked } from 'marked';
import { db } from '@repo/db';
import { documents, documentChunks } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { generateDocumentId, generateChunkId } from '../utils/fileUtils';
import { uploadDocument } from '../utils/documentStorage';
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

      // Ensure content is a Buffer and get its length
      const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      const contentSize = contentBuffer.length;

      if (!contentSize || contentSize === 0) {
        throw new Error('Document content is empty');
      }

      logger.info(`Document size: ${contentSize} bytes`);

      // Extract text content
      let text: string;
      if (type === 'pdf') {
        const pdfData = await pdf(contentBuffer);
        text = pdfData.text || '';
        
        // Validate extracted text
        if (!text || typeof text !== 'string') {
          throw new Error('Failed to extract text from PDF document');
        }
        
        // Trim and validate text has content
        text = text.trim();
        if (text.length === 0) {
          throw new Error('PDF document appears to be empty or contains no extractable text');
        }
      } else if (type === 'markdown') {
        text = contentBuffer.toString('utf-8');
        
        // Validate extracted text
        if (!text || typeof text !== 'string') {
          throw new Error('Failed to extract text from markdown document');
        }
        
        text = text.trim();
        if (text.length === 0) {
          throw new Error('Markdown document appears to be empty');
        }
      } else {
        throw new Error(`Unsupported document type: ${type}`);
      }
      
      logger.info(`Extracted ${text.length} characters of text from document`);

      // Generate document ID
      const documentId = generateDocumentId();

      // Upload document to MinIO
      const { storagePath, storageUrl } = await uploadDocument({
        buffer: contentBuffer,
        filename,
        contentType: type === 'pdf' ? 'application/pdf' : 'text/markdown',
        userId,
        documentId,
      });

      logger.info(`Document uploaded to MinIO: ${storagePath}`);

      // Create document record with storage path
      const [document] = await db.insert(documents)
        .values({
          id: documentId,
          filename,
          contentType: type,
          size: contentSize,
          storagePath,
          status: 'processing',
          userId,
          metadata: metadata || {},
        })
        .returning();

      logger.info(`Created document record: ${document.id}`);

      // Split text into chunks
      const chunks = this.splitTextIntoChunks(text);
      logger.info(`Split document into ${chunks.length} chunks`);

      // Filter out any invalid chunks before processing
      const validChunks = chunks.filter(
        (chunk) => chunk && typeof chunk === 'string' && chunk.trim().length > 0
      );
      
      if (validChunks.length !== chunks.length) {
        logger.warn(`Filtered out ${chunks.length - validChunks.length} invalid chunks before processing`);
      }
      
      if (validChunks.length === 0) {
        throw new Error('No valid text chunks found in document after processing');
      }

      logger.info(`Processing ${validChunks.length} valid chunks`);

      // Process chunks in batches to generate embeddings
      const processedChunks: DocumentChunk[] = [];
      const batchSize = 10; // Process 10 chunks at a time

      for (let i = 0; i < validChunks.length; i += batchSize) {
        const batch = validChunks.slice(i, i + batchSize);
        
        logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validChunks.length / batchSize)} with ${batch.length} chunks`);
        
        // Skip empty batches
        if (batch.length === 0) {
          logger.warn('Skipping empty batch');
          continue;
        }
        
        // Validate batch before processing
        const invalidInBatch = batch.filter(c => !c || typeof c !== 'string' || c.trim().length === 0);
        if (invalidInBatch.length > 0) {
          logger.error(`Found ${invalidInBatch.length} invalid chunks in batch at index ${i}`);
          logger.error('Invalid chunks:', invalidInBatch);
          throw new Error(`Invalid chunks found in batch ${Math.floor(i / batchSize) + 1}`);
        }

        const batchEmbeddings = await this.generateEmbeddings(batch);

        // Only process if we got valid embeddings back
        if (batchEmbeddings.length > 0) {
          processedChunks.push(...batchEmbeddings);

          // Save batch to database
          await this.saveChunksToDatabase(document.id, batchEmbeddings, i);
          
          logger.info(`Successfully saved ${batchEmbeddings.length} chunks to database`);
        } else {
          logger.warn(`Batch ${Math.floor(i / batchSize) + 1} returned no embeddings`);
        }

        logger.info(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validChunks.length / batchSize)}`);
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
    if (!text || typeof text !== 'string' || text.length === 0) {
      logger.warn('Cannot split empty or invalid text into chunks');
      return [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      if (end >= text.length) {
        const chunk = text.slice(start).trim();
        if (chunk.length > 0) {
          chunks.push(chunk);
        }
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

      const chunk = text.slice(start, end).trim();
      if (chunk && chunk.length > 0) {
        chunks.push(chunk);
      }
      
      start = Math.max(start + 1, end - this.chunkOverlap);
    }

    // Final filter to ensure no undefined, null, or empty chunks
    return chunks.filter(
      (chunk) => chunk && typeof chunk === 'string' && chunk.trim().length > 0
    );
  }

  private async generateEmbeddings(chunks: string[]): Promise<DocumentChunk[]> {
    console.log('=== generateEmbeddings CALLED ===');
    console.log('Input chunks length:', chunks.length);
    console.log('First 3 chunks:', chunks.slice(0, 3));
    
    try {
      // Double-check: Filter out any empty, null, or undefined chunks (defensive programming)
      const validChunks = chunks.filter(
        (chunk) => chunk != null && typeof chunk === 'string' && chunk.trim().length > 0
      );

      console.log('Valid chunks after filtering:', validChunks.length);

      if (validChunks.length === 0) {
        console.log('ERROR: No valid chunks to generate embeddings for');
        logger.warn('No valid chunks to generate embeddings for');
        return [];
      }

      if (validChunks.length !== chunks.length) {
        console.log(`WARNING: Filtered out ${chunks.length - validChunks.length} invalid chunks`);
        logger.warn(
          `Filtered out ${chunks.length - validChunks.length} invalid chunks before generating embeddings`
        );
        logger.warn('Invalid chunks:', chunks.filter((chunk, idx) => !validChunks.includes(chunks[idx])));
      }

      // Final validation: ensure no undefined values
      const finalChunks = validChunks.map((chunk, idx) => {
        if (chunk == null || typeof chunk !== 'string') {
          logger.error(`Found invalid chunk at index ${idx}:`, chunk);
          return null;
        }
        return chunk.trim();
      }).filter((chunk): chunk is string => chunk != null && chunk.length > 0);

      if (finalChunks.length === 0) {
        logger.error('All chunks were invalid after final validation');
        return [];
      }

      logger.info(`Generating embeddings for ${finalChunks.length} chunks`);
      
      // Log the first few chunks to verify they're valid
      logger.info('First 3 chunks:', finalChunks.slice(0, 3).map(c => `"${c.substring(0, 50)}..."`));
      
      // Explicit validation right before API call
      for (let i = 0; i < finalChunks.length; i++) {
        if (finalChunks[i] == null || typeof finalChunks[i] !== 'string' || finalChunks[i].length === 0) {
          logger.error(`CRITICAL: Invalid chunk at index ${i}:`, finalChunks[i], typeof finalChunks[i]);
          throw new Error(`Invalid chunk detected at index ${i}: ${typeof finalChunks[i]}`);
        }
      }
      
      logger.info('All chunks validated successfully, calling OpenAI API...');

      // CRITICAL: Final check right before API call - ensure no undefined/null values
      const hasInvalidValues = finalChunks.some((chunk, idx) => {
        const isInvalid = chunk === undefined || chunk === null || typeof chunk !== 'string' || chunk.length === 0;
        if (isInvalid) {
          logger.error(`CRITICAL ERROR: Invalid chunk at index ${idx} right before API call:`, {
            value: chunk,
            type: typeof chunk,
            isNull: chunk === null,
            isUndefined: chunk === undefined
          });
        }
        return isInvalid;
      });
      
      if (hasInvalidValues) {
        throw new Error('Found invalid values in finalChunks array before API call');
      }

      // Generate embeddings for all valid chunks in parallel
      console.log('=== ABOUT TO CALL EMBED API ===');
      console.log('Total chunks to process:', finalChunks.length);
      console.log('All chunks are strings:', finalChunks.every(c => typeof c === 'string'));
      console.log('First chunk preview:', finalChunks[0]?.substring(0, 50));
      console.log('Chunk types:', finalChunks.map(c => typeof c));
      console.log('=== CALLING EMBED NOW ===');
      
      logger.info('=== ABOUT TO CALL EMBED API ===');
      logger.info('Total chunks to process:', finalChunks.length);
      
      // BYPASS AI SDK - Call OpenAI API directly
      console.log('=== CALLING OPENAI API DIRECTLY ===');
      console.log('Chunks to embed:', finalChunks.length);
      
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
          input: finalChunks,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('=== API CALL SUCCESSFUL ===');
      console.log('Received embeddings:', data.data?.length);
      
      const embeddings = data.data.map((item: any) => item.embedding);
      
      logger.info(`Received ${embeddings?.length || 0} embeddings from API`);

      if (!embeddings || embeddings.length !== finalChunks.length) {
        throw new Error(`Expected ${finalChunks.length} embeddings but got ${embeddings?.length || 0}`);
      }

      return finalChunks.map((text, index) => ({
        text,
        embedding: embeddings[index],
      }));
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      logger.error('Chunks that failed:', JSON.stringify(chunks, null, 2));
      logger.error('Chunk types:', chunks.map(chunk => typeof chunk));
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
        id: generateChunkId(),
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