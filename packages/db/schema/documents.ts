import { pgTable, text, integer, timestamp, jsonb, varchar, boolean, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

// Documents table for storing uploaded files
export const documents = pgTable('documents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  filename: text('filename').notNull(),
  contentType: varchar('content_type', { length: 50, enum: ['pdf', 'markdown'] }).notNull(),
  size: integer('size').notNull(),
  storagePath: text('storage_path'), // MinIO/S3 storage path
  status: varchar('status', { length: 50, enum: ['uploading', 'processing', 'completed', 'failed'] }).notNull().default('uploading'),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Document chunks table for storing text chunks and embeddings
export const documentChunks = pgTable('document_chunks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  documentId: varchar('document_id', { length: 255 }).notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  text: text('text').notNull(),
  embeddingVector: vector('embedding_vector', { dimension: 1536 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Jobs table for tracking background jobs
export const jobs = pgTable('jobs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  type: varchar('type', { length: 50, enum: ['document_processing'] }).notNull(),
  status: varchar('status', { length: 50, enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  documentId: varchar('document_id', { length: 255 }).references(() => documents.id, { onDelete: 'set null' }),
  result: jsonb('result').$type<Record<string, any>>(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Define relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
  chunks: many(documentChunks),
  jobs: many(jobs),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(user, {
    fields: [jobs.userId],
    references: [user.id],
  }),
  document: one(documents, {
    fields: [jobs.documentId],
    references: [documents.id],
  }),
}));

// Types for TypeScript
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;