import { auth } from "@/lib/auth";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { db, chatMessages, chatSessions } from "@/db";
import { getUserApiKey } from "@/lib/api-keys";
import { eq } from "drizzle-orm";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get model from header
    const modelId = request.headers.get('X-Model') || 'gpt-4o-mini';

    // Parse request body
    const { messages, sessionId, apiKeyId } = await request.json();

    // Determine which API key to use - user's key or environment key
    let apiKey = process.env.OPENAI_API_KEY;
    let usingUserKey = false;
    
    if (apiKeyId) {
      const userApiKey = await getUserApiKey(session.user.id, 'openai');
      if (userApiKey) {
        apiKey = userApiKey;
        usingUserKey = true;
      }
    }

    // Check for API key
    if (!apiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Ensure we have a valid session ID for persistence
    let currentSessionId = sessionId;
    if (!currentSessionId && messages.length > 0) {
      // Create new session for first message
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          userId: session.user.id,
          title: messages[0]?.content?.substring(0, 50) + "..." || "New Chat",
        })
        .returning({ id: chatSessions.id });
      currentSessionId = newSession.id;
    }

    // Save user message to database if we have a session
    if (currentSessionId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        await db.insert(chatMessages).values({
          sessionId: currentSessionId,
          userId: session.user.id,
          role: 'user',
          content: lastMessage.content,
          apiKeyId: usingUserKey ? apiKeyId : null,
          provider: 'openai',
          model: modelId,
        });
      }
    }

    // Create streaming response using AI SDK with selected model
    const result = streamText({
      model: openai(modelId, {
        apiKey: apiKey,
      }),
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      onFinish: async (result) => {
        // Save assistant response to database
        if (currentSessionId && result.text) {
          await db.insert(chatMessages).values({
            sessionId: currentSessionId,
            userId: session.user.id,
            role: 'assistant',
            content: result.text,
            apiKeyId: usingUserKey ? apiKeyId : null,
            provider: 'openai',
            model: modelId,
            metadata: {
              usage: result.usage,
              finishReason: result.finishReason,
            },
          });

          // Update session timestamp
          await db
            .update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, currentSessionId));
        }
      },
    });

    const response = result.toUIMessageStreamResponse();
    
    // Add session ID to response headers
    if (currentSessionId) {
      response.headers.set('X-Session-ID', currentSessionId);
    }

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new Response('Rate limit exceeded. Please try again later.', { status: 429 });
      }
      if (error.message.includes('quota')) {
        return new Response('API quota exceeded. Please check your OpenAI billing.', { status: 402 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}