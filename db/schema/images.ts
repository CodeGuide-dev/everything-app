import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const imageGenerationStatusEnum = pgEnum("image_generation_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
]);

export const imageAssetRoleEnum = pgEnum("image_asset_role", [
  "input",
  "mask",
  "output",
]);

export const imageSessions = pgTable(
  "image_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    thumbnailAssetId: text("thumbnail_asset_id"),
    provider: text("provider"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userCreatedIdx: index("image_sessions_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const imageGenerations = pgTable(
  "image_generations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => imageSessions.id, { onDelete: "cascade" }),
    parentGenerationId: text("parent_generation_id").references(
      () => imageGenerations.id,
      { onDelete: "set null" },
    ),
    status: imageGenerationStatusEnum("status").notNull().default("queued"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    prompt: text("prompt"),
    negativePrompt: text("negative_prompt"),
    params: jsonb("params").$type<Record<string, unknown>>(),
    error: text("error"),
    sourceAssetId: text("source_asset_id"),
    maskAssetId: text("mask_asset_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cost: numeric("cost", { precision: 12, scale: 4 }),
    durationMs: integer("duration_ms"),
  },
  (table) => ({
    sessionCreatedIdx: index("image_generations_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
    parentIdx: index("image_generations_parent_idx").on(table.parentGenerationId),
    statusIdx: index("image_generations_status_idx").on(table.status),
  }),
);

export const imageAssets = pgTable(
  "image_assets",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    generationId: text("generation_id")
      .notNull()
      .references(() => imageGenerations.id, { onDelete: "cascade" }),
    role: imageAssetRoleEnum("role").notNull(),
    storageProvider: text("storage_provider").notNull(),
    storageBucket: text("storage_bucket"),
    storageKey: text("storage_key").notNull(),
    storageUrl: text("storage_url"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    sha256: text("sha256"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    generationIdx: index("image_assets_generation_idx").on(table.generationId),
    roleGenerationIdx: index("image_assets_role_generation_idx").on(
      table.role,
      table.generationId,
    ),
  }),
);

export const imageGenerationEvents = pgTable(
  "image_generation_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    generationId: text("generation_id")
      .notNull()
      .references(() => imageGenerations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    generationEventIdx: index("image_generation_events_generation_idx").on(
      table.generationId,
    ),
    typeIdx: index("image_generation_events_type_idx").on(table.type),
  }),
);

// Legacy table kept for backwards compatibility while the new session-based
// model rolls out. Prefer using the image_sessions/* tables above.
export const generatedImages = pgTable(
  "generated_images",
  {
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
  },
  (table) => ({
    userIdIdx: index("generated_images_user_id_idx").on(table.userId),
    createdAtIdx: index("generated_images_created_at_idx").on(table.createdAt),
  }),
);
