import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // Call worker service API
    const response = await fetch(`${WORKER_API_URL}/api/search/similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        query: validatedData.query,
        limit: validatedData.limit,
        threshold: validatedData.threshold,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Worker service error:', errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Search failed'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      query: result.query,
      results: result.results,
    });

  } catch (error) {
    console.error('Search error:', error);

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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'documents';

    let workerEndpoint: string;

    switch (endpoint) {
      case 'documents':
        workerEndpoint = `${WORKER_API_URL}/api/search/documents?${searchParams.toString()}`;
        break;
      case 'stats':
        workerEndpoint = `${WORKER_API_URL}/api/search/stats`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid endpoint' },
          { status: 400 }
        );
    }

    // Call worker service API
    const response = await fetch(workerEndpoint, {
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
          error: errorData.error || 'Request failed'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);

  } catch (error) {
    console.error('API request error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}