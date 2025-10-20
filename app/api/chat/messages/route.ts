import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, chatMessages, chatSessions } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createMessageSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  apiKeyId: z.string().uuid().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const getMessagesSchema = z.object({
  sessionId: z.string().uuid(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/chat/messages - Get messages for a session
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryParams = {
      sessionId: url.searchParams.get("sessionId"),
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    };

    const { sessionId, limit = 50, offset = 0 } = getMessagesSchema.parse(queryParams);

    // Verify session belongs to user
    const [sessionExists] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, session.user.id)
        )
      )
      .limit(1);

    if (!sessionExists) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get messages for the session
    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        provider: chatMessages.provider,
        model: chatMessages.model,
        metadata: chatMessages.metadata,
        createdAt: chatMessages.createdAt,
        apiKeyId: chatMessages.apiKeyId,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt)
      .limit(Math.min(limit, 100))
      .offset(Math.max(offset, 0));

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Save a new message
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, role, content, apiKeyId, provider, model, metadata } = createMessageSchema.parse(body);

    // Verify session belongs to user
    const [sessionExists] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, session.user.id)
        )
      )
      .limit(1);

    if (!sessionExists) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Insert the message
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        userId: session.user.id,
        role,
        content,
        apiKeyId: apiKeyId || null,
        provider: provider || null,
        model: model || null,
        metadata: metadata || null,
      })
      .returning({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        provider: chatMessages.provider,
        model: chatMessages.model,
        metadata: chatMessages.metadata,
        createdAt: chatMessages.createdAt,
      });

    // Update session's updatedAt timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    return NextResponse.json({ 
      message: "Message saved successfully", 
      chatMessage: newMessage 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}