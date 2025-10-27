import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  createImageSession,
  runImageGeneration,
} from "@/lib/image-generation-service";
import { getPublicUrl } from "@/lib/storage";

// Allow up to 60 seconds for image generation
export const maxDuration = 60;

// Schema for request validation
const imageGenerationSchema = z.object({
    prompt: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
    try {
        // Get session from better-auth
        const session = await auth.api.getSession({
            headers: request.headers
        });

        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = imageGenerationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid prompt", details: validation.error.errors },
                { status: 400 }
            );
        }

        const { prompt } = validation.data;

        const imageSession = await createImageSession({
            userId: session.user.id,
            provider: "google",
            model: "gemini-2.5-flash-image-preview",
            seedPrompt: prompt,
        });

        const generation = await runImageGeneration({
            sessionId: imageSession.id,
            userId: session.user.id,
            prompt,
            provider: "google",
            model: "gemini-2.5-flash-image-preview",
        });

        return NextResponse.json({
            success: true,
            image: {
                id: generation.outputAsset.id,
                url: getPublicUrl(generation.outputAsset.storageKey),
                prompt,
                createdAt: generation.generation.completedAt ?? new Date(),
                storageKey: generation.outputAsset.storageKey,
                storageUrl: generation.outputAsset.storageUrl,
                sessionId: generation.session.id,
                generationId: generation.generation.id,
            },
        });

    } catch (error) {
        console.error('Image generation API error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }
            if (error.message.includes('quota')) {
                return NextResponse.json(
                    { error: 'API quota exceeded. Please check your billing.' },
                    { status: 402 }
                );
            }
        }

        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
