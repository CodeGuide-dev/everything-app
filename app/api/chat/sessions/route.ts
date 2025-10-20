import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, chatSessions, chatMessages } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const createSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

const updateSessionSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(255),
});

// GET /api/chat/sessions - List user's chat sessions
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Get sessions with message count and last message time
    const sessions = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        messageCount: sql<number>`count(${chatMessages.id})`.as("messageCount"),
        lastMessageAt: sql<Date>`max(${chatMessages.createdAt})`.as("lastMessageAt"),
      })
      .from(chatSessions)
      .leftJoin(chatMessages, eq(chatSessions.id, chatMessages.sessionId))
      .where(eq(chatSessions.userId, session.user.id))
      .groupBy(chatSessions.id, chatSessions.title, chatSessions.createdAt, chatSessions.updatedAt)
      .orderBy(desc(sql`max(${chatMessages.createdAt})`), desc(chatSessions.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create new chat session
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = createSessionSchema.parse(body);

    const [newSession] = await db
      .insert(chatSessions)
      .values({
        userId: session.user.id,
        title: title || "New Chat",
      })
      .returning({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
      });

    return NextResponse.json({ 
      message: "Chat session created successfully", 
      session: newSession 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/sessions - Update session title
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, title } = updateSessionSchema.parse(body);

    const [updatedSession] = await db
      .update(chatSessions)
      .set({ 
        title,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId))
      .returning({
        id: chatSessions.id,
        title: chatSessions.title,
        updatedAt: chatSessions.updatedAt,
      });

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Session updated successfully", 
      session: updatedSession 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}