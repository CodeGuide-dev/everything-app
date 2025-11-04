import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userApiKeys = pgTable("user_api_keys", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'openai', 'anthropic', 'google', etc.
    encryptedKey: text("encrypted_key").notNull(),
    keyName: text("key_name"), // Optional user-friendly name
    isActive: text("is_active").notNull().$defaultFn(() => "true"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("user_api_keys_user_id_idx").on(table.userId),
    providerIdx: index("user_api_keys_provider_idx").on(table.provider),
}));