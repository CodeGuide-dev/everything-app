import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { runImageGeneration } from "@/lib/image-generation-service";
import { getPublicUrl } from "@/lib/storage";

const generateSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1).max(2000),
  provider: z.string().min(1).max(120).optional(),
  model: z.string().min(1).max(120).optional(),
  parentGenerationId: z.string().min(1).optional(),
  sourceAssetId: z.string().min(1).optional(),
  maskAssetId: z.string().min(1).optional(),
  negativePrompt: z.string().min(1).max(2000).optional(),
  params: z.record(z.any()).optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = generateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await runImageGeneration({
      sessionId: parsed.data.sessionId,
      userId: session.user.id,
      prompt: parsed.data.prompt,
      provider: parsed.data.provider,
      model: parsed.data.model,
      parentGenerationId: parsed.data.parentGenerationId,
      sourceAssetId: parsed.data.sourceAssetId,
      maskAssetId: parsed.data.maskAssetId,
      params: parsed.data.params || null,
      negativePrompt: parsed.data.negativePrompt || null,
    });

    return NextResponse.json({
      session: result.session,
      generation: result.generation,
      outputAsset: {
        ...result.outputAsset,
        url: getPublicUrl(result.outputAsset.storageKey),
      },
    });
  } catch (error) {
    console.error("Failed to generate image", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
