# Plan: Iterative Image Generation + Session Persistence

## Summary
- Goal: Enable image-to-image iteration (use the last output as the next input) and persist image generation sessions, steps, and assets in the database.
- Scope: API, DB schema (Drizzle), minimal UI hooks, storage abstraction, and security/validation.

## User Stories
- As a user, I can start an image generation session and see all versions produced in that session.
- As a user, I can pick any previously generated image in a session and use it as the input for the next generation (img2img, optional mask).
- As a user, I can view parameters (prompt, seed, strength, model, dimensions) associated with each generation step.
- As a user, I can resume a session later and continue iterating from any prior output.

## High-Level Design
- Sessions model a chain (or tree) of generations.
- Each generation can have zero/one parent generation (for linear flows) or any parent (for branching). We support branching with `parentGenerationId`.
- Each generation stores its parameters and status; assets table stores files for input, mask, and output.
- API supports: create session, generate image (text-to-image or image-to-image), fetch session, list sessions, and upload mask.
- UI: session list, session detail with generation history and “Iterate from this image”.

## Data Model (Drizzle + Postgres)
New schema file: `db/schema/images.ts`

Tables:
- image_sessions
  - id (pk)
  - userId (fk → users.id)
  - title (nullable, user-provided)
  - thumbnailAssetId (fk → image_assets.id, nullable)
  - model (last-used model for quick resume)
  - createdAt, updatedAt
  - indexes: (userId, createdAt desc)

- image_generations
  - id (pk)
  - sessionId (fk → image_sessions.id)
  - parentGenerationId (fk → image_generations.id, nullable) — for iteration/forking
  - status: queued | running | succeeded | failed | canceled
  - provider (e.g., openai | stability | google)
  - model (e.g., dalle-3, sdxl, imagen, etc.)
  - prompt (text), negativePrompt (text, nullable)
  - params (jsonb): { width, height, steps, guidance, strength, scheduler, seed, safety }
  - error (text, nullable)
  - createdAt, startedAt, completedAt
  - cost (numeric, nullable), durationMs (int, nullable)
  - indexes: (sessionId, createdAt), (parentGenerationId)

- image_assets
  - id (pk)
  - generationId (fk → image_generations.id)
  - role: input | mask | output
  - storageProvider (e.g., vercel-blob | s3 | local)
  - storageBucket (nullable), storageKey/path (unique-ish), url (cached public URL)
  - mimeType, sizeBytes, width, height, sha256 (nullable)
  - createdAt
  - indexes: (generationId), (role, generationId)

- Optional: image_generation_events (telemetry)
  - id (pk), generationId (fk), type, payload (jsonb), createdAt

Minimal Drizzle skeleton (illustrative only):
```ts
// db/schema/images.ts
import { pgTable, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core'

export const imageSessions = pgTable('image_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title'),
  thumbnailAssetId: text('thumbnail_asset_id'),
  model: text('model'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userCreatedIdx: index('image_sessions_user_created_idx').on(t.userId, t.createdAt),
}))

export const imageGenerations = pgTable('image_generations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  parentGenerationId: text('parent_generation_id'),
  status: text('status').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  prompt: text('prompt'),
  negativePrompt: text('negative_prompt'),
  params: jsonb('params').$type<Record<string, unknown>>().notNull(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cost: text('cost'),
  durationMs: integer('duration_ms'),
}, (t) => ({
  sessionCreatedIdx: index('image_generations_session_created_idx').on(t.sessionId, t.createdAt),
  parentIdx: index('image_generations_parent_idx').on(t.parentGenerationId),
}))

export const imageAssets = pgTable('image_assets', {
  id: text('id').primaryKey(),
  generationId: text('generation_id').notNull(),
  role: text('role').notNull(), // input | mask | output
  storageProvider: text('storage_provider').notNull(),
  storageBucket: text('storage_bucket'),
  storageKey: text('storage_key').notNull(),
  url: text('url'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  width: integer('width'),
  height: integer('height'),
  sha256: text('sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  generationIdx: index('image_assets_generation_idx').on(t.generationId),
}))
```

Notes:
- Use your project’s ID strategy (UUIDs or `cuid2`) consistently.
- Add foreign key references in Drizzle once existing `users` table is confirmed.

## API Design
Routes (App Router):
- POST `app/api/images/sessions/route.ts`
  - Create a session. Body: { title?, model? }
  - Returns: { sessionId }

- GET `app/api/images/sessions/[sessionId]/route.ts`
  - Fetch session details with generations, assets, and a flat list or tree.

- GET `app/api/images/sessions/route.ts`
  - List sessions for current user (paginated).

- POST `app/api/images/generate/route.ts`
  - Start a generation job.
  - Body:
    - sessionId (required)
    - provider, model
    - prompt, negativePrompt?
    - params: { width, height, steps, guidance, strength, scheduler, seed }
    - sourceAssetId? (use prior output as new input)
    - maskAssetId? (optional)
  - Behavior: create generation row (queued → running → completed), stream progress; on completion store output asset and update session thumbnail.

- POST `app/api/images/assets/route.ts`
  - Upload asset (input/mask) via signed URL or multipart; returns `assetId`.

Response shape for `generate` (simplified):
```json
{
  "generationId": "gen_...",
  "status": "running",
  "streamUrl": "/api/images/generate/stream?generationId=..."
}
```
On completion:
```json
{ "generationId": "gen_...", "status": "succeeded", "outputAssetId": "asset_...", "url": "..." }
```

## Iteration Flow
1. User creates or opens a session.
2. User runs text-to-image (no `sourceAssetId`).
3. On any output, the UI offers “Iterate from this image”.
4. Next generation sends the chosen output’s `assetId` as `sourceAssetId` plus new prompt/params.
5. Server saves lineage via `parentGenerationId` and attaches input/output assets.
6. UI renders a timeline (or branching tree) to navigate versions.

## UI/UX Additions
- Navigation: add Images entry in sidebar (`/images`).
- Pages overview:
  - `app/images/page.tsx` (Main screen): centered title + primary textarea CTA; previous sessions grid below.
  - `app/images/[sessionId]/page.tsx` (Session): large image viewer with prompt input to iterate; history panel.
- Components (shadcn/ui): Textarea, Button, Card grid for sessions, file uploader, parameter sliders, image viewer, breadcrumb.

### Main Screen (Landing) UX — `app/images/page.tsx`
- Hero title centered: “Image Studio” (or app-specific title) with short subtitle.
- Centered prompt textarea (auto-resize) with placeholder: “Describe the image you want to create…”.
- Primary button “Generate” below textarea; optional model selector inline or as a popover.
- On submit:
  1) Create a new session via `POST /api/images/sessions`; backend auto-generates the session title from the prompt.
  2) Immediately call `POST /api/images/generate` with `{ sessionId, prompt, params }`.
  3) Redirect (`router.push`) to `/images/[sessionId]` with a loading state until the first output is ready.
- Below the CTA: “Previous sessions” grid (Cards) for the current user.
  - Card contains thumbnail, title or first prompt excerpt, last updated timestamp.
  - Click navigates to `/images/[sessionId]`.
  - Empty state: friendly illustration + “No sessions yet — start by entering a prompt above.”
- Performance/UX:
  - Use Server Component to fetch sessions list; paginate or infinite-scroll (12 per page).
  - Skeletons for grid; optimistic UI for creating the session.

### Session Page UX & Flow — `app/images/[sessionId]/page.tsx`
- Layout: content-first with a prominent image area, then prompt input beneath.
- Top section:
  - Image viewer showing the latest output; while generating, show animated placeholder/skeleton.
  - Metadata badges: model, size, seed, status.
- Prompt input beneath the image:
  - Textarea + “Generate” button; optional advanced params drawer (size, guidance, strength, seed).
  - “Iterate from this image” by default uses the latest output as `sourceAssetId`. Allow choosing any prior output via a dropdown.
- History/navigation:
  - Right rail or bottom strip with thumbnails for prior outputs. Selecting one sets it as the parent for the next generation (branching allowed).
  - Show step numbers; clicking shows parameters and timing.
- Actions:
  - Upload input image (img2img) and optional mask; these become `image_assets` with role input/mask.
  - Regenerate with new seed; duplicate step; delete failed steps (soft-delete optional).
- Flow on submit:
  1) Create `image_generations` row with `parentGenerationId` = selected prior step (or latest by default).
  2) Stream progress; on completion attach output asset and update session thumbnail if empty.
  3) Auto-scroll to the new output and keep the prompt input in view for quick iteration.

### Accessibility & Quality
- Keyboard first: focus on textarea on load, `Cmd/Ctrl+Enter` to submit.
- Respect theme; ensure color contrast on overlays and skeletons.
- Announce generation status changes for screen readers (aria-live).

## Storage Strategy
- Abstract via a small storage service:
  - `lib/storage.ts`: put/get/remove, return public URL; swap providers (Vercel Blob, S3, local dev).
- Store metadata in `image_assets`; store only URLs/keys in DB.

## Security, Validation, and Limits
- Auth required: all routes use Better Auth session; enforce `userId` ownership at query level.
- Input validation with `zod` for API payloads and environment variables (API keys, storage).
- Limits: max image size/resolution, file types, rate limits per user/session.
- Abuse prevention: checksum dedupe, extension/MIME checks, strip EXIF for privacy.

## State & Data Flow
- `app/images/page.tsx` loads recent sessions on the server, hydrates a client component for the prompt CTA.
- On submit, client creates session → kicks off generation → redirects to `/images/[sessionId]`, passing optimistic state through router or query params.
- Session page (`app/images/[sessionId]/page.tsx`) fetches session, generations, and assets via parallel server queries; suspense boundaries keep prompt input interactive while data streams.
- Client state (Zustand or React context) keeps track of the currently selected generation, pending generations, and form params; syncing with server responses via swr/react-query ensures consistency.
- Streaming updates (SSE or HTTP chunking) update the generation status; UI moves generation from “in-progress” slot to the history stack once output asset arrives.
- Branch selection simply swaps `parentGenerationId` in local state; submission posts to API with chosen asset.

## Implementation Checklist
- **Schema & Drizzle**
  - Add `db/schema/images.ts` with tables + relations; export to Drizzle config.
  - Generate SQL migration and apply locally; verify `drizzle-kit` snapshots.
- **API Routes**
  - `POST /api/images/sessions`: create session, validate title/model, return ID.
  - `GET /api/images/sessions`: paginate user sessions sorted by updatedAt.
  - `GET /api/images/sessions/[sessionId]`: hydrate session detail with nested generations/assets.
  - `POST /api/images/assets`: upload or accept signed URL metadata for input/mask assets.
  - `POST /api/images/generate`: schedule generation, stream status, persist assets.
- **Workers / Providers**
  - Integrate primary model provider via `@ai-sdk` or provider SDK; abstract generation pipeline.
  - Implement `img2img` path when `sourceAssetId` present; fetch asset binary from storage within sandbox limits.
- **UI**
  - Build main screen prompt card with textarea, Generate button, model selector, and sessions grid.
  - Implement session page layout (image viewer, prompt form, history rail, metadata panel).
  - Add route transitions, loading skeletons, error toasts, keyboard shortcuts.
- **Storage Layer**
  - Create `lib/storage.ts` with provider-agnostic API (put/get/remove, getSignedUrl).
  - Ensure uploads respect size/MIME limits; clean up failed partials.
- **State & Validation**
  - Shared Zod schemas for API payloads and responses; reuse on client.
  - Zustand slice for prompt params, selected generation, and streaming status.
- **Testing & Observability**
  - Unit tests for schema parsing, API validation, storage helper.
  - Integration test for session creation + first generation (mock provider response).
  - Structured logs for generation lifecycle; metrics hooks for cost/duration.

## Integration Touchpoints
- Dashboard: add “Images” entry to `app/(dashboard)/layout` sidebar; ensure Better Auth guard allows access only when signed in.
- Feature flag: optional `env.NEXT_PUBLIC_FEATURE_IMAGES` toggle to hide UI until stable.
- Breadcrumbs/Header: update `site-header` to show current session title and quick actions.
- Notifications: integrate with existing toast system (`useToast`) to report generation progress/errors.
- Analytics: hook into existing event pipeline (if any) to emit `image_session_created`, `image_generation_started/completed` events.

## Performance & Scaling Considerations
- Queue long-running generations via background worker (Inngest/Next.js queue) to avoid API timeouts.
- Cache session list queries with stale-while-revalidate on the main page; bust cache when new generation completes.
- Avoid large payloads: paginate generations, lazy-load older steps; load asset URLs on demand.
- Store generated images in bucket with CDN; avoid serving large binaries directly from API routes.
- Batch writes: wrap generation+asset inserts in transaction to keep data consistent.
- Apply database indexes noted above; monitor query plans as data grows.

## Session Lifecycle Breakdown
1. **Create Session**: user submits first prompt from landing → API creates `image_sessions` row and initial `image_generations` entry (status `queued`).
2. **Generate Image**: provider worker picks job, updates status `running`, streams progress, stores output asset, marks status `succeeded`/`failed`.
3. **Iterate**: user selects an output, enters new prompt, API records new generation with `parentGenerationId` referencing chosen step.
4. **Persist**: session `updatedAt` set to now; thumbnail refreshed if needed.
5. **Cleanup**: optional job to prune failed/canceled generations or orphaned assets.

## Migration / Rollout Strategy
- Step 1: Deploy schema + migrations, leaving UI hidden behind feature flag.
- Step 2: Release API endpoints + landing page CTA to staging; run smoke tests.
- Step 3: Enable session detail page and iteration features internally (staff testing).
- Step 4: Turn on feature flag gradually; monitor DB/storage usage, provider costs.
- Step 5: Backfill analytics dashboards; announce availability to users.

## Risks & Mitigations
- **High provider cost**: add per-user rate limiting, display credit usage, and enforce max generations/day.
- **Large storage footprint**: implement retention policy (e.g., auto-archive after 30 days) and expose delete options.
- **API timeouts**: offload to background job with webhook/websocket updates.
- **Prompt abuse**: implement content filtering before invoking providers; sanitize filenames/metadata.
- **Concurrency collisions**: use optimistic locking when updating session thumbnail or metadata.
- **Data corruption**: enforce transactions + foreign keys; add smoke tests around migrations.

## Testing Matrix
- API happy paths: create session, generate initial image, iterate with source asset.
- API edge cases: invalid model, missing session, unauthorized user, large prompt, disallowed file type.
- UI flow: landing CTA → session redirect, generation status updates, selecting previous outputs, error toasts.
- Storage: handle failed upload, cleanup, verify URLs are valid/expiring.
- Accessibility: keyboard navigation, ARIA announcements, focus management.
- Cross-browser: Chrome/Edge/Safari for main UI and streaming compatibility.

## Observability & Monitoring
- Log generation lifecycle with correlation IDs (sessionId + generationId) for tracing.
- Capture provider latency, cost, and success rate metrics; alert on failure spikes.
- Track user-level usage to display in dashboard (optional quota UI).
- Implement Sentry (or existing tool) instrumentation on API routes for error visibility.

## Documentation & Support
- Update product docs / onboarding flow to highlight iterative image capabilities.
- Add in-app tooltips explaining iteration, branching, and session history.
- Create runbook for ops (rotating provider keys, handling stuck jobs, purging old assets).
- Ensure CodeGuide documentation generation includes new schema/API references once implemented.

## Phased Implementation
- Phase 1: Schema + migrations (`db/schema/images.ts`), route scaffolds, storage abstraction.
- Phase 2: Minimal UI to create a session and run a single generation.
- Phase 3: Iteration support (use `sourceAssetId`, set `parentGenerationId`), session timeline.
- Phase 4: Streaming progress, error states, and cleanup of failed partials.
- Phase 5: Tests (API integration), polishing (thumbnails, sharing later if needed).

## Open Questions / Decisions
- Providers: first implementation target (OpenAI, Stability, Google) and model list.
- Storage provider of record in production (Vercel Blob vs S3).
- Whether to support masks in v1 (UI complexity) or later.
- Retention policy for assets (auto-cleanup failed generations?).

## Success Criteria
- Users can start a session, generate an image, pick that output to drive the next generation, and see both steps saved with parameters and assets.
- Session history is persisted and loadable across logins.
- Minimal UI to traverse versions and regenerate from any point.

## Next Steps
- Confirm provider and model(s) to target first.
- Approve schema and routes.
- Implement Phase 1 (schema + scaffolds) and wire to dashboard navigation.
