import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, userApiKeys } from "@/db";
import { encryptApiKey, decryptApiKey, hashApiKey } from "@/lib/crypto";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "cohere", "mistral"]),
  apiKey: z.string().min(1, "API key is required"),
  keyName: z.string().optional(),
});

const deleteApiKeySchema = z.object({
  keyId: z.string().uuid(),
});

// GET /api/keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db
      .select({
        id: userApiKeys.id,
        provider: userApiKeys.provider,
        keyName: userApiKeys.keyName,
        isActive: userApiKeys.isActive,
        createdAt: userApiKeys.createdAt,
        hashedKey: userApiKeys.encryptedKey, // We'll show a hash for identification
      })
      .from(userApiKeys)
      .where(eq(userApiKeys.userId, session.user.id))
      .orderBy(userApiKeys.createdAt);

    // Transform encrypted keys to show only a hash for security
    const maskedKeys = keys.map((key) => ({
      ...key,
      maskedKey: key.hashedKey.split(':')[0].substring(0, 8) + '...',
      hashedKey: undefined,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, keyName } = createApiKeySchema.parse(body);

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);

    // Create the key record
    const [newKey] = await db
      .insert(userApiKeys)
      .values({
        userId: session.user.id,
        provider,
        encryptedKey,
        keyName: keyName || `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`,
        isActive: "true",
      })
      .returning({
        id: userApiKeys.id,
        provider: userApiKeys.provider,
        keyName: userApiKeys.keyName,
        isActive: userApiKeys.isActive,
        createdAt: userApiKeys.createdAt,
      });

    return NextResponse.json({ 
      message: "API key created successfully", 
      key: {
        ...newKey,
        maskedKey: hashApiKey(apiKey),
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keyId } = deleteApiKeySchema.parse(body);

    // Delete the key (only if it belongs to the user)
    const result = await db
      .delete(userApiKeys)
      .where(
        and(
          eq(userApiKeys.id, keyId),
          eq(userApiKeys.userId, session.user.id)
        )
      )
      .returning({ id: userApiKeys.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "API key not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}