import { db, userApiKeys } from "@/db";
import { decryptApiKey } from "./crypto";
import { eq, and } from "drizzle-orm";

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

export const SUPPORTED_PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"] },
  { value: "google", label: "Google", models: ["gemini-pro", "gemini-pro-vision"] },
  { value: "cohere", label: "Cohere", models: ["command-r-plus", "command-r"] },
  { value: "mistral", label: "Mistral", models: ["mistral-large-latest", "mistral-medium-latest"] },
] as const;