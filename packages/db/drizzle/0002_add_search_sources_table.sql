CREATE TABLE "search_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"favicon_url" text,
	"snippet" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "search_sources_message_id_idx" ON "search_sources" USING btree ("message_id");
--> statement-breakpoint
ALTER TABLE "search_sources" ADD CONSTRAINT "search_sources_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
