-- Add generated_images table
CREATE TABLE IF NOT EXISTS "generated_images" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "prompt" text NOT NULL,
    "image_url" text NOT NULL,
    "model" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "generated_images_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

-- Add ai_usage table
CREATE TABLE IF NOT EXISTS "ai_usage" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "feature" text NOT NULL,
    "model" text NOT NULL,
    "provider" text NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "request_count" integer NOT NULL DEFAULT 1,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

-- Add indexes for generated_images
CREATE INDEX IF NOT EXISTS "generated_images_user_id_idx" ON "generated_images" ("user_id");
CREATE INDEX IF NOT EXISTS "generated_images_created_at_idx" ON "generated_images" ("created_at");

-- Add indexes for ai_usage
CREATE INDEX IF NOT EXISTS "ai_usage_user_id_idx" ON "ai_usage" ("user_id");
CREATE INDEX IF NOT EXISTS "ai_usage_feature_idx" ON "ai_usage" ("feature");
CREATE INDEX IF NOT EXISTS "ai_usage_created_at_idx" ON "ai_usage" ("created_at");
