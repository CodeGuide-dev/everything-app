DO $$ BEGIN
 CREATE TYPE "public"."ai_feature_type" AS ENUM('chat', 'web_search');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature_type" "ai_feature_type" NOT NULL,
	"metadata" json,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ai_usage_feature_type_idx" ON "ai_usage" USING btree ("feature_type");
--> statement-breakpoint
CREATE INDEX "ai_usage_user_feature_idx" ON "ai_usage" USING btree ("user_id","feature_type");
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
