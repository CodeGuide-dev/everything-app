import { NextRequest } from "next/server";
import { getImageObject } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET(
    _request: NextRequest,
    context: { params: { key?: string[] } }
) {
    const { key: keySegments } = context.params;

    if (!keySegments || keySegments.length === 0) {
        return new Response(
            JSON.stringify({ error: "Image key is required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const key = keySegments.map((segment) => decodeURIComponent(segment)).join("/");

    try {
        const { buffer, contentType, contentLength } = await getImageObject(key);

        const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
        };

        if (typeof contentLength === "number") {
            headers["Content-Length"] = contentLength.toString();
        }

        const filename = key.split("/").pop();
        if (filename) {
            headers["Content-Disposition"] = `inline; filename="${filename}"`;
        }

        return new Response(buffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Failed to fetch image from storage:", error);

        return new Response(
            JSON.stringify({ error: "Image not found" }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
