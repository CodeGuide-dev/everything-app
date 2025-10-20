import { auth } from "@/lib/auth";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

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
    const { messages } = await request.json();

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Create streaming response using AI SDK with selected model
    const result = streamText({
      model: openai(modelId),
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
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