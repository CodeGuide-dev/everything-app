import { NextRequest, NextResponse } from 'next/server';

const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Call worker service API
    const response = await fetch(`${WORKER_API_URL}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Worker service error:', errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to get job status'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      job: result.job,
    });

  } catch (error) {
    console.error('Job status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}