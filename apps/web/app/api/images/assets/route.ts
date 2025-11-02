import { NextResponse } from "next/server";

import { db, imageAssets, imageGenerations, imageSessions } from "@/db";
import { auth } from "@/lib/auth";
import { getPublicUrl, putImage } from "@/lib/storage";
import { eq } from "drizzle-orm";

const allowedRoles = new Set(["input", "mask"]);

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const generationId = formData.get("generationId");
    const role = formData.get("role");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (typeof generationId !== "string" || !generationId) {
      return NextResponse.json({ error: "generationId is required" }, { status: 400 });
    }

    if (typeof role !== "string" || !allowedRoles.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const result = await db
      .select({
        generation: imageGenerations,
        session: imageSessions,
      })
      .from(imageGenerations)
      .innerJoin(
        imageSessions,
        eq(imageGenerations.sessionId, imageSessions.id),
      )
      .where(eq(imageGenerations.id, generationId))
      .limit(1);

    const record = result[0];

    if (!record || record.session.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/png";

    const upload = await putImage({
      buffer,
      contentType,
      directory: `sessions/${record.session.id}/uploads`,
    });

    const [asset] = await db
      .insert(imageAssets)
      .values({
        generationId,
        role: role as "input" | "mask",
        storageProvider: upload.provider,
        storageBucket: upload.bucket,
        storageKey: upload.key,
        storageUrl: upload.storageUrl,
        mimeType: contentType,
        sizeBytes: buffer.length,
      })
      .returning();

    if (role === "input") {
      await db
        .update(imageGenerations)
        .set({ sourceAssetId: asset.id })
        .where(eq(imageGenerations.id, generationId));
    } else if (role === "mask") {
      await db
        .update(imageGenerations)
        .set({ maskAssetId: asset.id })
        .where(eq(imageGenerations.id, generationId));
    }

    return NextResponse.json({
      asset: {
        ...asset,
        url: getPublicUrl(asset.storageKey),
      },
    });
  } catch (error) {
    console.error("Failed to upload asset", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
