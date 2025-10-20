import { db, userApiKeys } from "@/db";
import { decryptApiKey } from "./crypto";
import { eq, and } from "drizzle-orm";

// Re-export constants for backward compatibility
export { SUPPORTED_PROVIDERS } from "./api-keys-constants";

export async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  try {
    const [keyRecord] = await db
      .select({
        encryptedKey: userApiKeys.encryptedKey,
        isActive: userApiKeys.isActive,
      })
      .from(userApiKeys)
      .where(
        and(
          eq(userApiKeys.userId, userId),
          eq(userApiKeys.provider, provider),
          eq(userApiKeys.isActive, "true")
        )
      )
      .limit(1);

    if (!keyRecord) {
      return null;
    }

    return decryptApiKey(keyRecord.encryptedKey);
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return null;
  }
}

export async function getUserApiKeyWithId(userId: string, apiKeyId: string): Promise<{ apiKey: string; provider: string } | null> {
  try {
    const [keyRecord] = await db
      .select({
        encryptedKey: userApiKeys.encryptedKey,
        provider: userApiKeys.provider,
        isActive: userApiKeys.isActive,
      })
      .from(userApiKeys)
      .where(
        and(
          eq(userApiKeys.id, apiKeyId),
          eq(userApiKeys.userId, userId),
          eq(userApiKeys.isActive, "true")
        )
      )
      .limit(1);

    if (!keyRecord) {
      return null;
    }

    return {
      apiKey: decryptApiKey(keyRecord.encryptedKey),
      provider: keyRecord.provider,
    };
  } catch (error) {
    console.error("Error retrieving API key with ID:", error);
    return null;
  }
}

