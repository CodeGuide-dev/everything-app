import { auth } from "@/lib/auth";
import { db, searchSources } from "@/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get message ID from query params
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return new Response('Message ID is required', { status: 400 });
    }

    // Fetch sources for the message
    const sources = await db
      .select()
      .from(searchSources)
      .where(eq(searchSources.messageId, messageId));

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Failed to fetch search sources:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
