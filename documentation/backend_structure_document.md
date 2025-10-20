# Backend Structure Document for everything-app

This document outlines the backend architecture, database management, APIs, hosting, infrastructure, security, monitoring, and maintenance strategies for the **everything-app**. It provides a clear, step-by-step overview so anyone—technical or not—can understand how the backend is built and operates.

## 1. Backend Architecture

### Overview
- The backend is built on **Next.js API Routes**, giving us a familiar file-based structure to define endpoints alongside the frontend code.
- We follow a **component-driven** and **service-layer** pattern: each feature (Chat, Search, Image Generation) has its own API route, handler, and helper utilities.
- **Better Auth** powers user sign-up, sign-in, session management, and protected routes.
- **Drizzle ORM** connects the code to a **PostgreSQL** database in a type-safe way, reducing runtime errors.
- The AI interactions use **Vercel’s `@ai-sdk`** for model calls and **`assistant-ui`** for streaming responses.

### Scalability, Maintainability, Performance
- **Serverless functions** on Vercel auto-scale with demand—no manual server sizing.
- Service-layer abstractions keep business logic separate from route definitions, making features easier to extend and test.
- Type safety (TypeScript + Drizzle ORM) catches mismatches early, improving maintainability.
- Docker support (standalone output) ensures consistent environments from development to production.

## 2. Database Management

### Technologies Used
- Relational database: **PostgreSQL**
- ORM: **Drizzle ORM** (type-safe, migration support)

### Data Structure and Practices
- **Tables** represent users, chat threads, messages, preferences, search queries, and generated images.
- Drizzle handles schema migrations: each change is tracked and applied in versioned steps.
- Connections are managed via a pool for performance and reliability.
- Backups and restores follow standard PostgreSQL procedures, with automated nightly backups.

## 3. Database Schema

Below is a human-readable description of the main tables, followed by SQL definitions.

### Human-Readable Schema
- **users**: stores account info (ID, email, hashed password, timestamps).
- **threads**: groups messages into conversations, linked to a user.
- **messages**: individual chat lines, linked to a thread and a user, with content, role, and timestamp.
- **preferences**: per-user settings stored as JSON.
- **search_queries**: records of AI search inputs and returned summaries.
- **images**: metadata for generated images (prompt, URL, timestamps).

### SQL Definitions (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Threads table
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preferences table
CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Search queries table
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```  

## 4. API Design and Endpoints

We follow a **RESTful** approach, mapping each feature to its own route under `/api`.

- **Authentication** (`/api/auth/[...all]` via Better Auth)
  - Handles sign-up, sign-in, token/session management.

- **Chat** (`/api/chat`)
  - POST `/api/chat` : send user message, stream AI response, save message.
  - GET `/api/chat/threads` : list user’s chat threads.
  - GET `/api/chat/threads/:threadId/messages` : fetch messages in a thread.

- **Search** (`/api/search`)
  - POST `/api/search` : send query, return AI-generated summary, save record.

- **Image Generation** (`/api/image`)
  - POST `/api/image` : send prompt, stream back image URL, save metadata.

Each endpoint:
- Validates input (with a library like Zod).
- Calls the relevant AI or database service.
- Returns JSON streaming when appropriate (for chat and image).

## 5. Hosting Solutions

- **Cloud Provider**: Vercel (serverless platform optimized for Next.js)
- **Containerization**: Docker (`output: 'standalone'`) allows local and staging environments to mirror production.

Benefits:
- **Reliability**: Vercel’s managed infrastructure ensures high uptime and automated certificate management.
- **Scalability**: Functions scale automatically with traffic spikes.
- **Cost-Effectiveness**: Pay-as-you-go with free tier for low volume, easy to forecast costs.

## 6. Infrastructure Components

- **Load Balancing**: Built-in to Vercel’s edge network, distributing requests worldwide.
- **Caching**:
  - Static assets and page responses cached at the edge.
  - Option to integrate Redis for session caching or rate-limiting.
- **Content Delivery Network (CDN)**: Vercel’s global edge ensures fast content delivery.
- **Background Jobs** (future): Inngest can offload long-running tasks like high-resolution image generation.

Together, these components reduce latency, handle traffic surges, and provide a smooth user experience.

## 7. Security Measures

- **Authentication & Authorization**: Better Auth protects routes and verifies user identities.
- **Encryption**:
  - TLS for all in-transit data.
  - PostgreSQL managed service with at-rest encryption.
- **Input Validation & Sanitization**: Zod schemas ensure only valid data reaches services.
- **Environment Variables**: Validated at startup to avoid misconfiguration (API keys, DB URL).
- **Data Access Controls**: Row-level protections ensure users see only their own data.
- **Compliance**: Follows GDPR best practices—users can delete their data, and logs avoid storing PII.

## 8. Monitoring and Maintenance

- **Performance Monitoring**:
  - Vercel Analytics for request metrics.
  - Optionally integrate Sentry or LogRocket for error tracking.
- **Logging**:
  - Structured logs in serverless functions.
  - Alerts on failures and rate-limit breaches.
- **CI/CD**:
  - GitHub Actions or Vercel’s Git integration deploy on merge to main.
  - Pre-deployment tests include linting, type checks, and API contract tests.
- **Database Health**:
  - Regular migration reviews.
  - Automated backups and periodic restore drills.
- **Dependency Management**: Scheduled reviews and automated security updates via a bot (e.g., Dependabot).

## 9. Conclusion and Overall Backend Summary

The **everything-app** backend is a modern, full-stack solution built around Next.js API Routes, Better Auth, and a type-safe PostgreSQL setup with Drizzle ORM. It supports scalable AI features—Chat, Search, and Image Generation—via dedicated endpoints, all deployed on Vercel for reliability and global performance. Security, monitoring, and infrastructure choices ensure user data is protected and the system can grow seamlessly. This architecture provides a clear, maintainable path for expanding the super app into new AI-powered experiences.