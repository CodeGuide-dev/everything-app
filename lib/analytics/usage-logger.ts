import { db, aiUsage } from "@/db";
import type { aiFeatureTypeEnum } from "@/db/schema/analytics";

// Type for feature types
type AIFeatureType = typeof aiFeatureTypeEnum.enumValues[number];

// Metadata type for AI usage
export type UsageMetadata = {
  messageCount?: number;
  tokensUsed?: number;
  model?: string;
  provider?: string;
  sessionId?: string;
  searchQuery?: string;
  resultCount?: number;
  [key: string]: any;
};

// Log AI usage asynchronously to avoid blocking the main request
export async function logAIUsage(
  userId: string,
  featureType: AIFeatureType,
  metadata?: UsageMetadata
): Promise<void> {
  try {
    await db.insert(aiUsage).values({
      userId,
      featureType,
      metadata: metadata || {},
      createdAt: new Date(),
    });

    console.log('AI usage logged:', { userId, featureType, metadata });
  } catch (error) {
    // Log the error but don't fail the request
    console.error('Failed to log AI usage:', error);
  }
}

// Batch log multiple usage events (for bulk operations)
export async function logAIUsageBatch(
  events: Array<{
    userId: string;
    featureType: AIFeatureType;
    metadata?: UsageMetadata;
  }>
): Promise<void> {
  try {
    const values = events.map(event => ({
      userId: event.userId,
      featureType: event.featureType,
      metadata: event.metadata || {},
      createdAt: new Date(),
    }));

    await db.insert(aiUsage).values(values);
    console.log(`Batch logged ${events.length} AI usage events`);
  } catch (error) {
    console.error('Failed to batch log AI usage:', error);
  }
}
