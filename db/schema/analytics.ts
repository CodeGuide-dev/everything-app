import { pgTable, text, timestamp, index, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Enum for AI feature types
export const aiFeatureTypeEnum = pgEnum("ai_feature_type", ["chat", "web_search"]);

// AI Usage tracking table
export const aiUsage = pgTable("ai_usage", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    featureType: aiFeatureTypeEnum("feature_type").notNull(),
    metadata: json("metadata").$type<{
        messageCount?: number;
        tokensUsed?: number;
        model?: string;
        provider?: string;
        sessionId?: string;
        searchQuery?: string;
        resultCount?: number;
        [key: string]: any;
    }>(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
    createdAtIdx: index("ai_usage_created_at_idx").on(table.createdAt),
    featureTypeIdx: index("ai_usage_feature_type_idx").on(table.featureType),
    userFeatureIdx: index("ai_usage_user_feature_idx").on(table.userId, table.featureType),
}));

// Relations
export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
    user: one(user, {
        fields: [aiUsage.userId],
        references: [user.id],
    }),
}));
