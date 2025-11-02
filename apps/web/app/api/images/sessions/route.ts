import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  createImageSession,
  listImageSessions,
  runImageGeneration,
} from "@/lib/image-generation-service";
import { getPublicUrl } from "@/lib/storage";

const createSessionSchema = z.object({
  provider: z.string().min(1).max(120).optional(),
  model: z.string().min(1).max(120).optional(),
  prompt: z.string().min(1).max(2000).optional(),
  negativePrompt: z.string().min(1).max(2000).optional(),
  params: z.record(z.any()).optional(),
});

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = clampNumber(searchParams.get("limit"), 1, 50, 12);
    const offset = clampNumber(searchParams.get("offset"), 0, 1000, 0);

    const sessions = await listImageSessions(session.user.id, { limit, offset });

    return NextResponse.json({
      sessions: sessions.map((item) => ({
        ...item,
        thumbnail: item.thumbnail
          ? {
              ...item.thumbnail,
              url: getPublicUrl(item.thumbnail.storageKey),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Failed to list image sessions", error);
    return NextResponse.json(
      { error: "Failed to load image sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = createSessionSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { prompt, params, negativePrompt, ...sessionData } = parsed.data;

    const newSession = await createImageSession({
      userId: session.user.id,
      provider: sessionData.provider,
      model: sessionData.model,
      seedPrompt: prompt || null,
    });

    if (prompt) {
      const generationResult = await runImageGeneration({
        sessionId: newSession.id,
        userId: session.user.id,
        prompt,
        provider: sessionData.provider,
        model: sessionData.model,
        params: params || null,
        negativePrompt: negativePrompt || null,
      });

      return NextResponse.json(
        {
          session: generationResult.session,
          generation: generationResult.generation,
          outputAsset: {
            ...generationResult.outputAsset,
            url: getPublicUrl(generationResult.outputAsset.storageKey),
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Failed to create image session", error);
    const message =
      error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function clampNumber(
  value: string | null,
  min: number,
  max: number,
  fallback: number,
) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
