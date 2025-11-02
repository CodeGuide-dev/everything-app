import { logger } from './logger';

export interface FileInfo {
  type: 'pdf' | 'markdown';
  filename: string;
  size: number;
  mimeType: string;
}

export function validateFileInfo(buffer: Buffer, filename: string): FileInfo {
  // Extract file extension
  const extension = filename.split('.').pop()?.toLowerCase();

  // Validate file type
  let type: 'pdf' | 'markdown';
  let mimeType: string;

  if (extension === 'pdf') {
    // Check PDF magic bytes
    if (!buffer.toString('ascii', 0, 4).startsWith('%PDF')) {
      throw new Error('Invalid PDF file format');
    }
    type = 'pdf';
    mimeType = 'application/pdf';
  } else if (['md', 'markdown', 'txt'].includes(extension || '')) {
    type = 'markdown';
    mimeType = 'text/markdown';
  } else {
    throw new Error(`Unsupported file type: ${extension}. Only PDF and Markdown files are supported.`);
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (buffer.length > maxSize) {
    throw new Error(`File size (${buffer.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
  }

  // Validate file size (min 1 byte)
  if (buffer.length === 0) {
    throw new Error('File is empty');
  }

  return {
    type,
    filename,
    size: buffer.length,
    mimeType,
  };
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Limit filename length
}

export function extractTextFromMarkdown(content: string): string {
  // Remove markdown syntax and extract plain text
  return content
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove images
   (/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove lists
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

export async function bufferToBase64(buffer: Buffer): Promise<string> {
  return buffer.toString('base64');
}

export async function base64ToBuffer(base64: string): Promise<Buffer> {
  return Buffer.from(base64, 'base64');
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function estimateProcessingTime(fileSizeBytes: number, type: 'pdf' | 'markdown'): number {
  // Rough estimate in seconds
  const baseTime = type === 'pdf' ? 10 : 2; // PDFs take longer to process
  const sizeFactor = fileSizeBytes / (1024 * 1024); // Size in MB
  const processingTime = baseTime + (sizeFactor * 2); // 2 seconds per MB

  return Math.ceil(processingTime);
}