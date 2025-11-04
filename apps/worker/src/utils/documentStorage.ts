import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger';

const DEFAULT_ENDPOINT = 'http://localhost:9000';
const DEFAULT_REGION = 'us-east-1';
const DEFAULT_BUCKET = 'documents';

// Initialize S3 client for MinIO
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || DEFAULT_ENDPOINT,
  region: process.env.MINIO_REGION || DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.MINIO_DOCUMENTS_BUCKET || DEFAULT_BUCKET;

export interface UploadDocumentOptions {
  buffer: Buffer;
  filename: string;
  contentType: string;
  userId: string;
  documentId: string;
}

export interface UploadDocumentResult {
  storagePath: string;
  storageUrl: string;
}

/**
 * Upload a document to MinIO
 * @param options - Upload options containing buffer, filename, content type, userId, and documentId
 * @returns Promise with the storage path and URL
 */
export async function uploadDocument(
  options: UploadDocumentOptions
): Promise<UploadDocumentResult> {
  const { buffer, filename, contentType, userId, documentId } = options;

  try {
    // Create a structured path: documents/{userId}/{documentId}/{filename}
    const storagePath = `documents/${userId}/${documentId}/${filename}`;

    logger.info(`Uploading document to MinIO: ${storagePath}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        userId,
        documentId,
        originalFilename: filename,
      },
    });

    await s3Client.send(command);

    // Construct the storage URL
    const endpoint = process.env.MINIO_ENDPOINT || DEFAULT_ENDPOINT;
    const storageUrl = `${endpoint.replace(/\/$/, '')}/${BUCKET_NAME}/${storagePath}`;

    logger.info(`Document uploaded successfully: ${storagePath}`);

    return {
      storagePath,
      storageUrl,
    };
  } catch (error) {
    logger.error('Error uploading document to MinIO:', error);
    throw new Error(
      `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

