import { NextRequest, NextResponse } from 'next/server';

const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const userId = request.headers.get('x-user-id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Call worker service API
    const response = await fetch(`${WORKER_API_URL}/api/search/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Worker service error:', errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to get document'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get document error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const userId = request.headers.get('x-user-id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Call worker service API
    const response = await fetch(`${WORKER_API_URL}/api/search/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Worker service error:', errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to delete document'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Delete document error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}