# Project Requirements Document (PRD)

## 1. Project Overview

**Paragraph 1:**
Everything-app is envisioned as a “super app” that brings multiple AI-driven services—starting with a conversational AI chat—under one roof. Built on top of a Next.js full-stack starter template, it provides secure user authentication, a centralized dashboard, and a highly customizable UI. The initial focus is on delivering a real-time, streaming AI chat interface using Vercel’s `@ai-sdk` and the `assistant-ui` component library, backed by a PostgreSQL database via Drizzle ORM.

**Paragraph 2:**
The core problem Everything-app solves is fragmentation: users today must jump between different platforms for AI chat, AI search, and AI image generation. By unifying these tools into a single, cohesive experience, Everything-app aims to increase productivity and user engagement. Success for version 1 is measured by stable user authentication, reliable chat streaming, and accurate storage of conversation history—all delivered with a modern, accessible UI and sub-second response times for small prompts.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1):**
- User sign-up, sign-in, and session management via the `better-auth` library.
- Protected dashboard with sidebar and header navigation.
- AI Chat interface under `/chat` route:
  - Real-time, streaming conversations via `@ai-sdk`.
  - UI components from `assistant-ui` integrated with `shadcn/ui` & Tailwind CSS.
  - Persistent chat history stored in PostgreSQL using Drizzle ORM schemas (`threads`, `messages`).
- Environment variable management and validation using `zod`.
- Deployment setup for Vercel and Docker (standalone output).
- Code quality tooling: ESLint, Prettier, TypeScript.

**Out-of-Scope (Later Phases):**
- AI Search feature under `/search` with summary generation.
- AI Image Generation under `/image` (e.g., Google Nano Banana).
- Background job processing (e.g., Inngest) for long-running tasks.
- Multi-provider AI abstraction layer (beyond initial `@ai-sdk`).
- Advanced user profiles or team collaboration features.

---

## 3. User Flow

**Paragraph 1:**
A new user lands on the home page and clicks “Sign Up.” They provide an email and password (or use a social login, if enabled), then verify their account. Upon successful sign-up, they are redirected to the dashboard at `/dashboard`. An existing user can sign in directly from the home page. Once authenticated, the user sees a sidebar on the left with links to “Chat,” and a main content area on the right showing the welcome message or recent chat threads.

**Paragraph 2:**
To start a new chat, the user clicks “Chat” in the sidebar. They land on `/chat` and see an input box at the bottom. As they type and hit “Send,” the UI shows a typing indicator while the `assistant-ui` component streams responses from the AI model. Each message—both user and AI—is appended to the conversation view in real time. The user can scroll through past messages; all chat data is saved automatically. If any error occurs (e.g., rate limit exceeded), a friendly alert appears with guidance.

---

## 4. Core Features

- **Authentication Module**: Sign-up, sign-in, session tokens, route protection (better-auth).
- **Dashboard Layout**: Responsive sidebar, header, theming (dark/light), navigation placeholders.
- **AI Chat Interface**:
  - Real-time streaming using Vercel `@ai-sdk`.
  - UI built with `assistant-ui` + `shadcn/ui` + Tailwind CSS.
  - Input validation, file/attachment support.
- **Data Persistence**:
  - Drizzle ORM schemas for `users`, `threads`, `messages`.
  - Type-safe queries and migrations.
- **API Endpoints**:
  - `/api/chat` POST route for streaming and saving messages.
  - Environment validation middleware (Zod).
- **Theming & Accessibility**:
  - Dark/light mode toggle.
  - WCAG-compliant UI components.
- **DevOps & Tooling**:
  - Dockerfile (`standalone`), Vercel deployment.
  - ESLint, Prettier, TypeScript.

---

## 5. Tech Stack & Tools

- **Frontend:** Next.js (App Router), React, TypeScript
- **UI Library:** `shadcn/ui`, Tailwind CSS, `assistant-ui`
- **AI Integration:** Vercel `@ai-sdk` for chat streaming
- **Backend:** Next.js API Routes, Node.js/TypeScript
- **Authentication:** `better-auth` library
- **Database:** PostgreSQL, Drizzle ORM
- **Validation:** Zod (env vars and request payloads)
- **Deployment:** Vercel (primary), Docker (standalone image)
- **Code Quality:** ESLint, Prettier, Husky (optional git hooks)
- **IDE Plugins (optional):** Cursor AI, Windsurf for in-editor docs
- **Future AI Models:** OpenAI GPT-4o, Google Nano Banana

---

## 6. Non-Functional Requirements

- **Performance:** 95th percentile chat response time < 1s for short prompts (<50 tokens). UI time-to-interactive < 2s.
- **Scalability:** Support 1,000 concurrent users with horizontal scaling on Vercel or container clusters.
- **Security:** HTTPS everywhere, secure HTTP-only cookies, CSRF protection, input sanitization to prevent prompt injection.
- **Compliance:** GDPR-ready; users can delete their data. Environment keys stored securely.
- **Usability:** WCAG AA accessibility, responsive design for mobile and desktop, dark/light mode.

---

## 7. Constraints & Assumptions

- **SDK Availability:** Vercel’s `@ai-sdk` is accessible and supports streaming in serverless functions.
- **Env Vars:** OPENAI_API_KEY (or equivalent) provided at build/deploy time.
- **Database:** PostgreSQL instance reachable from Vercel; migrations run pre-deploy.
- **Auth Library:** `better-auth` handles session storage and integrates with Next.js API routes.
- **Client Browser Support:** Last two versions of major browsers (Chrome, Firefox, Safari, Edge).
- **Team Skillset:** Familiarity with Next.js, TypeScript, Tailwind, React hooks.

---

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits:** Exceeding AI provider limits may cause 429 errors. Mitigation: backoff + user-friendly retry UI.
- **Serverless Timeouts:** Long-running streams could hit Vercel Function timeouts. Mitigation: limit max tokens, or use background jobs (Inngest) later.
- **Prompt Injection:** User-supplied prompts might contain malicious instructions. Mitigation: sanitize inputs, enforce content policies.
- **Schema Mismatches:** Changes in Drizzle ORM schemas can break data consistency. Mitigation: rigorous migration tests and type-safe queries.
- **Resource Costs:** Streaming multiple users increases API costs. Mitigation: monitor usage, implement rate-limiting per user.
- **Network Reliability:** Unstable connections can disrupt streaming UI. Mitigation: reconnect logic and partial transcript caching.


**End of PRD**