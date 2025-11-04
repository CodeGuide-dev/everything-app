import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getImageSession } from "@/lib/image-generation-service";
import { getPublicUrl } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getImageSession(session.user.id, params.sessionId);

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      session: result.session,
      generations: result.generations.map((generation) => ({
        ...generation,
        assets: generation.assets.map((asset) => ({
          ...asset,
          url: getPublicUrl(asset.storageKey),
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch image session", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 },
    );
  }
}
