import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";

import {
  db,
  imageAssets,
  imageGenerations,
  imageGenerationEvents,
  imageSessions,
} from "@/db";
import { logAIUsage } from "@/lib/analytics/usage-logger";
import { getImage, putImage } from "@/lib/storage";

export type ImageSessionRecord = typeof imageSessions.$inferSelect;
export type ImageGenerationRecord = typeof imageGenerations.$inferSelect;
export type ImageAssetRecord = typeof imageAssets.$inferSelect;

export interface GenerationParams {
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  strength?: number;
  scheduler?: string;
  seed?: number;
  [key: string]: unknown;
}

export interface CreateSessionInput {
  userId: string;
  title?: string | null;
  provider?: string | null;
  model?: string | null;
  seedPrompt?: string | null;
}

export interface RunGenerationInput {
  sessionId: string;
  userId: string;
  prompt: string;
  provider?: string | null;
  model?: string | null;
  parentGenerationId?: string | null;
  sourceAssetId?: string | null;
  maskAssetId?: string | null;
  negativePrompt?: string | null;
  params?: GenerationParams | null;
}

export interface RunGenerationResult {
  session: ImageSessionRecord;
  generation: ImageGenerationRecord;
  outputAsset: ImageAssetRecord;
}

export async function createImageSession({
  userId,
  title,
  provider,
  model,
  seedPrompt,
}: CreateSessionInput) {
  let resolvedTitle = title?.trim() || null;

  if (!resolvedTitle && seedPrompt?.trim()) {
    resolvedTitle = await generateSessionTitle(seedPrompt.trim(), {
      provider,
      model,
    });
  }

  const [session] = await db
    .insert(imageSessions)
    .values({
      userId,
      title: resolvedTitle,
      provider: provider || null,
      model: model || null,
    })
    .returning();

  return session;
}

export async function generateSessionTitle(
  prompt: string,
  {
    provider,
    model,
  }: { provider?: string | null; model?: string | null } = {},
) {
  if (!prompt.trim()) {
    return null;
  }

  const fallback = createFallbackTitle(prompt);

  if ((provider && provider !== "google") || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return fallback;
  }

  try {
    const normalizedModel = model ?? "gemini-1.5-flash";
    const textModelId = normalizedModel.includes("image")
      ? "gemini-1.5-flash"
      : normalizedModel;
    const titleModel = google(textModelId);
    const response = await generateText({
      model: titleModel,
      prompt: `Generate a concise, evocative title (max 6 words) for an image generation session based on the following description. Avoid quotes and punctuation other than commas. Description: ${prompt}`,
    });

    const candidate = response.text?.trim() || "";
    if (!candidate) {
      return fallback;
    }

    const cleaned = candidate
      .replace(/^"|"$/g, "")
      .replace(/\.$/, "")
      .trim();

    if (!cleaned) {
      return fallback;
    }

    return cleaned.length > 80 ? `${cleaned.slice(0, 77).trim()}…` : cleaned;
  } catch (error) {
    console.warn("generateSessionTitle fallback", error);
    return fallback;
  }
}

function createFallbackTitle(prompt: string) {
  const firstSentence = prompt.split(/[.!?\n]/u)[0] || prompt;
  const truncated = firstSentence.trim().slice(0, 80);
  if (!truncated) {
    return "Untitled Session";
  }
  return truncated[0].toUpperCase() + truncated.slice(1);
}

export async function listImageSessions(
  userId: string,
  { limit = 12, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const sessions = await db
    .select()
    .from(imageSessions)
    .where(eq(imageSessions.userId, userId))
    .orderBy(desc(imageSessions.updatedAt))
    .limit(limit)
    .offset(offset);

  const thumbnailIds = sessions
    .map((session) => session.thumbnailAssetId)
    .filter(Boolean) as string[];

  const thumbnails = thumbnailIds.length
    ? await db
        .select()
        .from(imageAssets)
        .where(inArray(imageAssets.id, thumbnailIds))
    : [];

  const thumbnailMap = new Map<string, ImageAssetRecord>();
  thumbnails.forEach((asset) => {
    thumbnailMap.set(asset.id, asset);
  });

  return sessions.map((session) => ({
    ...session,
    thumbnail: session.thumbnailAssetId
      ? thumbnailMap.get(session.thumbnailAssetId) || null
      : null,
  }));
}

export async function getImageSession(userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(imageSessions)
    .where(
      and(
        eq(imageSessions.id, sessionId),
        eq(imageSessions.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const generations = await db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.sessionId, sessionId))
    .orderBy(asc(imageGenerations.createdAt));

  const generationIds = generations.map((generation) => generation.id);

  const assets = generationIds.length
    ? await db
        .select()
        .from(imageAssets)
        .where(inArray(imageAssets.generationId, generationIds))
    : [];

  const assetMap = new Map<string, ImageAssetRecord[]>();
  assets.forEach((asset) => {
    const list = assetMap.get(asset.generationId) || [];
    list.push(asset);
    assetMap.set(asset.generationId, list);
  });

  return {
    session,
    generations: generations.map((generation) => ({
      ...generation,
      assets: assetMap.get(generation.id) || [],
    })),
  };
}

export async function runImageGeneration(
  input: RunGenerationInput,
): Promise<RunGenerationResult> {
  const {
    sessionId,
    userId,
    prompt,
    provider: providerOverride,
    model: modelOverride,
    parentGenerationId: parentOverride,
    sourceAssetId,
    maskAssetId,
    negativePrompt,
    params,
  } = input;

  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const sessionResult = await db
    .select()
    .from(imageSessions)
    .where(
      and(
        eq(imageSessions.id, sessionId),
        eq(imageSessions.userId, userId),
      ),
    )
    .limit(1);

  const session = sessionResult[0];

  if (!session) {
    throw new Error("Session not found");
  }

  // Determine parent generation default
  let parentGenerationId = parentOverride || null;
  if (!parentGenerationId) {
    const [latestGeneration] = await db
      .select({ id: imageGenerations.id })
      .from(imageGenerations)
      .where(eq(imageGenerations.sessionId, sessionId))
      .orderBy(desc(imageGenerations.createdAt))
      .limit(1);

    parentGenerationId = latestGeneration?.id || null;
  }

  const sourceAsset = sourceAssetId
    ? await findAssetInSession(sourceAssetId, sessionId)
    : null;

  const maskAsset = maskAssetId
    ? await findAssetInSession(maskAssetId, sessionId)
    : null;

  const provider = providerOverride || session.provider || "google";
  const model = modelOverride || session.model || "gemini-2.5-flash-image-preview";

  const [queuedGeneration] = await db
    .insert(imageGenerations)
    .values({
      sessionId,
      parentGenerationId,
      status: "queued",
      provider,
      model,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt?.trim() || null,
      params: params || null,
      sourceAssetId: sourceAsset?.asset.id || sourceAssetId || null,
      maskAssetId: maskAsset?.asset.id || maskAssetId || null,
    })
    .returning();

  const generationId = queuedGeneration.id;
  const start = new Date();

  await db
    .update(imageGenerations)
    .set({ status: "running", startedAt: start })
    .where(eq(imageGenerations.id, generationId));

  await db.insert(imageGenerationEvents).values({
    generationId,
    type: "status.running",
    payload: {
      provider,
      model,
    },
  });

  try {
    const { imageBuffer, contentType } = await generateImageFromProvider({
      prompt: prompt.trim(),
      provider,
      model,
      sourceAsset,
    });

    const upload = await putImage({
      buffer: imageBuffer,
      contentType,
      directory: `sessions/${sessionId}`,
    });

    let completedGeneration: ImageGenerationRecord | null = null;
    let outputAsset: ImageAssetRecord | null = null;
    let updatedSession: ImageSessionRecord | null = null;
    const end = new Date();
    const durationMs = end.getTime() - start.getTime();

    await db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(imageAssets)
        .values({
          generationId,
          role: "output",
          storageProvider: upload.provider,
          storageBucket: upload.bucket,
          storageKey: upload.key,
          storageUrl: upload.storageUrl,
          mimeType: contentType,
          sizeBytes: imageBuffer.length,
          createdAt: end,
        })
        .returning();

      outputAsset = asset;

      const [generation] = await tx
        .update(imageGenerations)
        .set({
          status: "succeeded",
          completedAt: end,
          durationMs,
        })
        .where(eq(imageGenerations.id, generationId))
        .returning();

      completedGeneration = generation;

      const [sessionUpdate] = await tx
        .update(imageSessions)
        .set({
          updatedAt: end,
          thumbnailAssetId: session.thumbnailAssetId || asset.id,
          provider,
          model,
        })
        .where(eq(imageSessions.id, sessionId))
        .returning();

      updatedSession = sessionUpdate;

      await tx.insert(imageGenerationEvents).values({
        generationId,
        type: "status.succeeded",
        payload: {
          assetId: asset.id,
          durationMs,
        },
      });
    });

    if (!completedGeneration || !outputAsset || !updatedSession) {
      throw new Error("Failed to persist generation outcome");
    }

    await logAIUsage(userId, "image_generation", {
      model,
      provider,
      sessionId,
    });

    return {
      session: updatedSession,
      generation: completedGeneration,
      outputAsset,
    };
  } catch (error) {
    const failureTime = new Date();
    const message =
      error instanceof Error ? error.message : "Image generation failed";

    await db
      .update(imageGenerations)
      .set({
        status: "failed",
        error: message,
        completedAt: failureTime,
      })
      .where(eq(imageGenerations.id, generationId));

    await db.insert(imageGenerationEvents).values({
      generationId,
      type: "status.failed",
      payload: {
        message,
      },
    });

    throw error;
  }
}

async function findAssetInSession(assetId: string, sessionId: string) {
  const result = await db
    .select({
      asset: imageAssets,
      generationSessionId: imageGenerations.sessionId,
    })
    .from(imageAssets)
    .innerJoin(
      imageGenerations,
      eq(imageAssets.generationId, imageGenerations.id),
    )
    .where(eq(imageAssets.id, assetId))
    .limit(1);

  const record = result[0];

  if (!record || record.generationSessionId !== sessionId) {
    throw new Error("Asset does not belong to this session");
  }

  return record;
}

async function generateImageFromProvider({
  prompt,
  provider,
  model,
  sourceAsset,
}: {
  prompt: string;
  provider: string;
  model: string;
  sourceAsset: { asset: ImageAssetRecord; generationSessionId: string } | null;
}) {
  if (provider !== "google") {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const aiModel = google(model);

  const result = await generateText({
    model: aiModel,
    prompt: sourceAsset
      ? [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              await buildInputImagePayload(sourceAsset.asset),
            ],
          },
        ]
      : prompt,
  });

  const imageFiles = result.files?.filter((file) =>
    file.mediaType?.startsWith("image/"),
  );

  if (!imageFiles || imageFiles.length === 0) {
    throw new Error("No images were generated");
  }

  const imageFile = imageFiles[0];

  const buffer = await convertToBuffer(imageFile);
  const contentType = imageFile.mediaType || "image/png";

  return { imageBuffer: buffer, contentType };
}

async function buildInputImagePayload(asset: ImageAssetRecord) {
  const { buffer, contentType } = await getImage(asset.storageKey);

  const format = inferFormat(contentType) || "png";

  return {
    type: "image" as const,
    image: buffer,
    mediaType: contentType || "image/png",
  };
}

function inferFormat(contentType: string | undefined | null) {
  if (!contentType) return undefined;
  const [, subtype] = contentType.split("/");
  return subtype?.split(";")[0];
}

async function convertToBuffer(file: {
  base64?: string;
  uint8Array?: Uint8Array;
  data?: string | Uint8Array | Buffer;
}) {
  if (file.base64) {
    const base64Data = file.base64.includes(",")
      ? file.base64.split(",")[1]
      : file.base64;
    return Buffer.from(base64Data, "base64");
  }

  if (file.uint8Array instanceof Uint8Array) {
    return Buffer.from(file.uint8Array);
  }

  if (typeof file.data === "string") {
    const base64Data = file.data.includes(",")
      ? file.data.split(",")[1]
      : file.data;
    return Buffer.from(base64Data, "base64");
  }

  if (file.data instanceof Uint8Array) {
    return Buffer.from(file.data);
  }

  if (file.data instanceof Buffer) {
    return file.data;
  }

  throw new Error("Unsupported image data format");
}
