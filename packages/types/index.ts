export interface DatabaseUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface AIUsageAnalytics {
  id: string;
  userId: string;
  model: string;
  tokensUsed: number;
  cost: number;
  operationType: 'chat' | 'embedding' | 'image_generation';
  createdAt: Date;
}

export interface ImageGeneration {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  filename: string;
  contentType: 'pdf' | 'markdown';
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  embeddingVector: number[];
  createdAt: Date;
}

export interface JobStatus {
  id: string;
  type: 'document_processing';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}