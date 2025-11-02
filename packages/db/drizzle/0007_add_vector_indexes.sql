-- Create vector similarity search index for document chunks
-- Note: We'll add this after the initial migration since we need to modify the embedding_vector column

-- First, let's create a separate migration to alter the embedding_vector column to be a proper vector type
ALTER TABLE "document_chunks"
DROP COLUMN IF EXISTS "embedding_vector";

--> statement-breakpoint

ALTER TABLE "document_chunks"
ADD COLUMN "embedding_vector" vector(1536); -- Assuming OpenAI's text-embedding-3-small which returns 1536 dimensions

--> statement-breakpoint

-- Create index for vector similarity search
CREATE INDEX ON "document_chunks" USING ivfflat ("embedding_vector" vector_cosine_ops) WITH (lists = 100);

--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX ON "documents" ("user_id");
CREATE INDEX ON "documents" ("status");
CREATE INDEX ON "documents" ("created_at");

--> statement-breakpoint

CREATE INDEX ON "document_chunks" ("document_id");
CREATE INDEX ON "document_chunks" ("chunk_index");

--> statement-breakpoint

CREATE INDEX ON "jobs" ("user_id");
CREATE INDEX ON "jobs" ("status");
CREATE INDEX ON "jobs" ("type");
CREATE INDEX ON "jobs" ("created_at");
CREATE INDEX ON "jobs" ("document_id");