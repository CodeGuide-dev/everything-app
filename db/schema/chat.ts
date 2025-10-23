import { pgTable, text, timestamp, index, json } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { userApiKeys } from "./api-keys";

export const chatSessions = pgTable("chat_sessions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().$defaultFn(() => "New Chat"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("chat_sessions_user_id_idx").on(table.userId),
    createdAtIdx: index("chat_sessions_created_at_idx").on(table.createdAt),
}));

export const chatMessages = pgTable("chat_messages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
        .notNull()
        .references(() => chatSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    apiKeyId: text("api_key_id")
        .references(() => userApiKeys.id, { onDelete: "set null" }), // nullable for user messages
    provider: text("provider"), // 'openai', 'anthropic', etc. - nullable for user messages
    model: text("model"), // 'gpt-4', 'claude-3.5-sonnet', etc. - nullable for user messages
    role: text("role").notNull(), // 'user', 'assistant', 'system'
    content: text("content").notNull(),
    metadata: json("metadata"), // Additional data like token usage, attachments, etc.
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    sessionIdIdx: index("chat_messages_session_id_idx").on(table.sessionId),
    userIdIdx: index("chat_messages_user_id_idx").on(table.userId),
    createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
    roleIdx: index("chat_messages_role_idx").on(table.role),
}));

export const searchSources = pgTable("search_sources", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id")
        .notNull()
        .references(() => chatMessages.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    faviconUrl: text("favicon_url"),
    snippet: text("snippet"), // Optional snippet/description from search result
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    messageIdIdx: index("search_sources_message_id_idx").on(table.messageId),
}));