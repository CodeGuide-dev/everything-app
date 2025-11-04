import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UPLOAD_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

// Allowed file types and their corresponding MIME types
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/markdown': 'markdown',
  'text/plain': 'markdown',
};

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const uploadSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate user ID
    const validatedData = uploadSchema.parse({ userId });

    // Validate file type
    const fileType = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    if (!fileType) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Only PDF and Markdown files are supported.`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${file.size} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
        },
        { status: 400 }
      );
    }

    // Validate file size (not empty)
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Convert to base64
    const base64Content = Buffer.from(uint8Array).toString('base64');

    // Call worker service API
    const response = await fetch(`${UPLOAD_API_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: fileType,
        filename: file.name,
        content: base64Content,
        userId: validatedData.userId,
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Worker service error:', errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to process file'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    console.log(`File uploaded successfully: ${file.name}, Job ID: ${result.jobId}`);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      estimatedProcessingTime: result.estimatedProcessingTime,
      fileInfo: result.fileInfo,
      message: 'File uploaded and queued for processing successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}