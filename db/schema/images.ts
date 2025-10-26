import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const generatedImages = pgTable("generated_images", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    imageUrl: text("image_url").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("generated_images_user_id_idx").on(table.userId),
    createdAtIdx: index("generated_images_created_at_idx").on(table.createdAt),
}));

export const aiUsage = pgTable("ai_usage", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(), // 'chat', 'image_generation', etc.
    model: text("model").notNull(),
    provider: text("provider").notNull(), // 'openai', 'google', 'anthropic', etc.
    promptTokens: integer("prompt_tokens"), // nullable for image generation
    completionTokens: integer("completion_tokens"), // nullable for image generation
    totalTokens: integer("total_tokens"), // nullable for image generation
    requestCount: integer("request_count").notNull().$defaultFn(() => 1),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
    featureIdx: index("ai_usage_feature_idx").on(table.feature),
    createdAtIdx: index("ai_usage_created_at_idx").on(table.createdAt),
}));
