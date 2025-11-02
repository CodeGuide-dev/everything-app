DO $$ BEGIN
 CREATE TYPE "public"."image_generation_status" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."image_asset_role" AS ENUM ('input', 'mask', 'output');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "image_sessions" (
 "id" text PRIMARY KEY NOT NULL,
 "user_id" text NOT NULL,
 "title" text,
 "thumbnail_asset_id" text,
 "provider" text,
 "model" text,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "image_generations" (
 "id" text PRIMARY KEY NOT NULL,
 "session_id" text NOT NULL,
 "parent_generation_id" text,
 "status" "image_generation_status" DEFAULT 'queued' NOT NULL,
 "provider" text NOT NULL,
 "model" text NOT NULL,
 "prompt" text,
 "negative_prompt" text,
 "params" jsonb,
 "error" text,
 "source_asset_id" text,
 "mask_asset_id" text,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "started_at" timestamptz,
 "completed_at" timestamptz,
 "cost" numeric(12, 4),
 "duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "image_assets" (
 "id" text PRIMARY KEY NOT NULL,
 "generation_id" text NOT NULL,
 "role" "image_asset_role" NOT NULL,
 "storage_provider" text NOT NULL,
 "storage_bucket" text,
 "storage_key" text NOT NULL,
 "storage_url" text,
 "mime_type" text,
 "size_bytes" integer,
 "width" integer,
 "height" integer,
 "sha256" text,
 "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "image_generation_events" (
 "id" text PRIMARY KEY NOT NULL,
 "generation_id" text NOT NULL,
 "type" text NOT NULL,
 "payload" jsonb,
 "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_sessions_user_created_idx" ON "image_sessions" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_generations_session_created_idx" ON "image_generations" USING btree ("session_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_generations_parent_idx" ON "image_generations" USING btree ("parent_generation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_generations_status_idx" ON "image_generations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_assets_generation_idx" ON "image_assets" USING btree ("generation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_assets_role_generation_idx" ON "image_assets" USING btree ("role","generation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_generation_events_generation_idx" ON "image_generation_events" USING btree ("generation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_generation_events_type_idx" ON "image_generation_events" USING btree ("type");
--> statement-breakpoint
ALTER TABLE "image_sessions" ADD CONSTRAINT "image_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_session_id_image_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."image_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "image_generations" ADD CONSTRAINT "image_generations_parent_generation_id_image_generations_id_fk" FOREIGN KEY ("parent_generation_id") REFERENCES "public"."image_generations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "image_assets" ADD CONSTRAINT "image_assets_generation_id_image_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."image_generations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "image_generation_events" ADD CONSTRAINT "image_generation_events_generation_id_image_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."image_generations"("id") ON DELETE cascade ON UPDATE no action;
