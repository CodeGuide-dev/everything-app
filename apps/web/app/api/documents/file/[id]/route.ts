import { NextRequest, NextResponse } from 'next/server';
import { getDocumentObject } from '@/lib/s3';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document metadata from Next.js API route
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        // Forward cookies for session
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Document API error:', errorData);

      return NextResponse.json(
        { error: errorData.error || 'Failed to get document' },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result.success || !result.document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = result.document;
    const storagePath = document.storagePath;

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Document storage path not found' },
        { status: 404 }
      );
    }

    // Verify the document belongs to the user
    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to document' },
        { status: 403 }
      );
    }

    // Retrieve document from MinIO
    const { buffer, contentType, contentLength } = await getDocumentObject(storagePath);

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    };

    if (typeof contentLength === 'number') {
      headers['Content-Length'] = contentLength.toString();
    }

    // Set Content-Disposition header for proper filename handling
    const filename = document.filename || 'document.pdf';
    const disposition = request.nextUrl.searchParams.get('download') === 'true' 
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;
    headers['Content-Disposition'] = disposition;

    // @ts-expect-error - Buffer is compatible with Response body at runtime
    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Failed to fetch document from storage:', error);

    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  }
}

