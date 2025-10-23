import { auth } from "@/lib/auth";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { streamText, generateObject } from "ai";
import { db, chatMessages, chatSessions } from "@/db";
import { getUserApiKey } from "@/lib/api-keys";
import { eq } from "drizzle-orm";
import { searxngService } from "@/lib/services/searxng";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Schema for search query generation
const searchQuerySchema = z.object({
  queries: z.array(z.string()).max(3).describe("Generate 1-3 search queries to find relevant information"),
  reasoning: z.string().describe("Brief explanation of why these queries are relevant"),
});

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


    // Parse request body
    const body = await request.json();
    const { messages, sessionId, apiKeyId, aiModel, useSearch } = body;
    console.log('Received request body:', {
      messagesLength: messages?.length,
      sessionId,
      aiModel,
      useSearch,
      firstMessage: messages?.[0]
    });
    const modelId = aiModel

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
      // Extract title from first message
      let title = "New Chat";
      const firstMessage = messages[0];

      if (firstMessage?.content) {
        let contentText = '';
        if (typeof firstMessage.content === 'string') {
          contentText = firstMessage.content;
        } else if (Array.isArray(firstMessage.content)) {
          // Handle assistant-ui format: [{ type: "text", text: "..." }]
          contentText = firstMessage.content
            .filter((part: { type: string; text?: string }) => part.type === 'text')
            .map((part: { type: string; text?: string }) => part.text || '')
            .join('');
        }

        if (contentText) {
          title = contentText.substring(0, 50) + (contentText.length > 50 ? "..." : "");
        }
      }

      // Create new session for first message
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          userId: session.user.id,
          title,
        })
        .returning({ id: chatSessions.id });
      currentSessionId = newSession.id;

      console.log('Created new chat session:', { sessionId: currentSessionId, title });
    }

    // Save user message to database if we have a session
    if (currentSessionId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('Last message:', { role: lastMessage.role, contentType: typeof lastMessage.content, isArray: Array.isArray(lastMessage.content) });

      if (lastMessage.role === 'user') {
        // Extract text content from message content array
        let contentText = '';
        if (typeof lastMessage.content === 'string') {
          contentText = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          // Handle assistant-ui format: [{ type: "text", text: "..." }]
          contentText = lastMessage.content
            .filter((part: { type: string; text?: string }) => part.type === 'text')
            .map((part: { type: string; text?: string }) => part.text || '')
            .join('');
        }

        console.log('Extracted content text:', { length: contentText.length, preview: contentText.substring(0, 100) });

        if (contentText) {
          const [savedMessage] = await db.insert(chatMessages).values({
            sessionId: currentSessionId,
            userId: session.user.id,
            role: 'user',
            content: contentText,
            apiKeyId: usingUserKey ? apiKeyId : null,
            provider: 'openai',
            model: modelId,
          }).returning({ id: chatMessages.id });

          console.log('Saved user message:', { messageId: savedMessage.id, sessionId: currentSessionId });
        } else {
          console.error('Failed to extract content text from message:', lastMessage.content);
        }
      }
    }

    // Create streaming response using AI SDK with selected model
    // Create OpenAI provider with the appropriate API key
    const openaiProvider = createOpenAI({
      apiKey: apiKey,
    });

    let assistantMessageSaved = false;

    // Validate and convert messages
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response('Invalid messages format', { status: 400 });
    }

    console.log('Converting messages:', messages);

    // Convert ThreadMessageLike format to AI SDK format
    const formattedMessages = messages.map((msg: any) => {
      let content = msg.content;

      // If content is an array (ThreadMessageLike format), extract text
      if (Array.isArray(content)) {
        content = content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
      }

      return {
        role: msg.role,
        content: content
      };
    });

    console.log('Formatted messages:', formattedMessages);

    // Handle search-augmented response if enabled
    let searchContext = "";
    if (useSearch) {
      try {
        console.log('Search enabled, generating search queries...');

        // Step 1: Use generateObject to create search queries from user message
        const lastUserMessage = formattedMessages[formattedMessages.length - 1];
        const queryGeneration = await generateObject({
          model: openaiProvider("gpt-4.1"),
          schema: searchQuerySchema,
          prompt: `Generate relevant search queries to answer this question: "${lastUserMessage.content}"`,
        });

        console.log('Generated search queries:', queryGeneration.object);

        // Step 2: Execute searches using SearXNG
        if (queryGeneration.object.queries.length > 0) {
          const searchResults = await searxngService.searchMultiple(queryGeneration.object.queries);

          // Step 3: Format search results as context
          searchContext = searxngService.formatSearchContext(searchResults);
          console.log('Search context generated, length:', searchContext.length);

          // Add search context to the messages
          formattedMessages.push({
            role: "system",
            content: `Here is relevant information from web searches:\n\n${searchContext}\n\nUse this information to provide an accurate and helpful response. Cite sources when possible.`,
          });
        }
      } catch (error) {
        console.error('Search error, falling back to direct chat:', error);
        // Continue with regular chat if search fails
      }
    }

    const result = streamText({
      model: openaiProvider(modelId),
      messages: formattedMessages,
      temperature: 0.7,
      onFinish: async (result) => {
        // Prevent duplicate saves
        if (assistantMessageSaved) {
          console.log('Assistant message already saved, skipping');
          return;
        }
        assistantMessageSaved = true;
        // Save assistant response to database
        if (currentSessionId && result.text) {
          const [savedMessage] = await db.insert(chatMessages).values({
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
          }).returning({ id: chatMessages.id });

          console.log('Saved assistant message:', { messageId: savedMessage.id, sessionId: currentSessionId, textLength: result.text.length });

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