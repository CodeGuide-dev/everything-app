# Project Requirements Document (PRD)

## 1. Project Overview

**Everything-App** is a starter platform built on Next.js that gives developers a ready-to-use foundation for AI-driven web applications. At its core, it provides real-time AI chat functionality, secure user authentication, a centralized dashboard, and in-app API key management. Instead of wiring up every piece from scratch, teams can clone this repo, configure environment variables, and jump straight into customizing AI workflows or extending the UI with new tools like search or image generation.

We’re building Everything-App to solve the common pain point of integrating multiple moving parts—front end, back end, database, AI SDKs, and UI components—into a single, maintainable codebase. Our success criteria are simple: developers should be able to sign up, chat with an AI model, store and retrieve messages, and manage API keys out of the box. Performance, type safety, and developer ergonomics guide every decision so that adding new AI modules in later phases is straightforward.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)
- User sign-up, sign-in, sign-out via **better-auth**.  
- Real-time, streaming **AI chat** interface using Vercel’s `@ai-sdk` + `assistant-ui`.  
- Dashboard page listing available AI tools (initially just Chat).  
- **API Key Manager**: create, view, revoke service keys.  
- Persistent storage of users, chat sessions, messages, and keys via **Drizzle ORM** + **PostgreSQL**.  
- Responsive, theme-toggle UI built with **React**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.  
- Deployment configuration for **Vercel** and standalone **Docker** builds.

### Out-of-Scope (Planned for Later Phases)
- AI search functionality (vector store, embeddings).  
- AI image generation workflows.  
- Background job queue for long-running tasks (e.g., BullMQ, Inngest).  
- User preferences beyond theme (advanced notifications, model defaults).  
- Automated testing (unit, integration, E2E).  
- Multi-tenant or enterprise-grade features (role-based access, usage quotas).

## 3. User Flow

A new visitor lands on the public site and clicks **Sign Up**. They fill in their email and password, submit, and receive an authenticated session. Upon successful sign-in, they’re redirected to the **Dashboard**. The dashboard shows a sidebar (Chat, Keys, Settings) and a main content area set to the classic AI chat interface by default. The user types a prompt, hits send, and sees the AI’s streaming response in real time.

From the dashboard, the user can switch to **API Keys** to generate or revoke keys for external AI services. They can toggle between light/dark mode at any time. When they’re done, they click **Log Out**, which clears their session and brings them back to the public landing page.

## 4. Core Features
- **Authentication**: Secure sign-up/sign-in/out flows with session cookies and password hashing.  
- **AI Chat Module**:  
  • Real-time streaming chat using `@ai-sdk`.  
  • Chat session management, message history, and role labels.  
- **Dashboard Hub**:  
  • Sidebar navigation for Chat & API Keys.  
  • Main area for dynamic tool rendering.  
- **API Key Management**:  
  • CRUD interface for service keys.  
  • Key permissions and expiration metadata.  
- **Database Layer**:  
  • PostgreSQL schemas via Drizzle ORM (users, sessions, messages, keys).  
  • Type-safe queries and migrations.  
- **UI Components**:  
  • Reusable buttons, inputs, modals from `shadcn/ui`.  
  • Chat thread, message bubble, model selector, theme toggle.  
- **Theming**: Light/dark mode persistence per user.  
- **Deployment**:  
  • Vercel-ready config.  
  • Docker standalone output.

## 5. Tech Stack & Tools
- Frontend: **Next.js (App Router)** + **React** + **TypeScript**.  
- Styling: **Tailwind CSS** + **shadcn/ui** components.  
- AI Integration: Vercel’s **@ai-sdk** + **assistant-ui** for streaming chat.  
- Authentication: **better-auth** for server/client flows.  
- Database: **PostgreSQL** managed via **Drizzle ORM**.  
- Deployment: **Vercel** + optional **Docker**.  
- Code Quality: **ESLint**, **Prettier**, **code-guide CLI**.  
- Potential IDE Plugins: **Cursor.ai** for AI-assisted coding, **Windsurf** for snippet management.

## 6. Non-Functional Requirements
- **Performance**:  
  • Chat response streaming latency ≤ 200ms per chunk.  
  • Page load time (Time to Interactive) < 2s on 3G simulated network.  
- **Scalability**:  
  • Support 1,000+ concurrent users without performance degradation.  
- **Security & Compliance**:  
  • All credentials via environment variables; no hardcoding.  
  • Data encryption at rest and in transit (HTTPS + TLS).  
  • OWASP Top 10 mitigation for web apps.  
  • GDPR-compatible user data handling (users can delete accounts).  
- **Usability & Accessibility**:  
  • WCAG 2.1 AA compliance for core pages.  
  • Responsive design for mobile, tablet, desktop.  
- **Reliability**:  
  • 99.9% uptime SLA on Vercel hosting.  
  • Automated health checks on API endpoints.

## 7. Constraints & Assumptions
- **Dependencies**:  
  • Vercel’s `@ai-sdk` must be available and support streaming.  
  • PostgreSQL instance with sufficient connection quota.  
  • Environment variables set in Vercel or Docker for secrets.  
- **Assumptions**:  
  • Users have modern browsers with WebSocket/Fetch support.  
  • GPT-4 or equivalent OpenAI API access is provisioned via API keys.  
  • No enterprise SSO or SAML needed in v1.0.

## 8. Known Issues & Potential Pitfalls
- **API Rate Limits**:  
  • Streaming calls to AI models may hit provider rate limits under heavy load.  
  • Mitigation: Implement retry/backoff logic and per-user throttling.  
- **Streaming Interruptions**:  
  • Network hiccups could break the chat stream.  
  • Mitigation: Buffer partial responses and allow users to resume or retry.  
- **Database Migrations**:  
  • Schema changes can conflict in production.  
  • Mitigation: Use Drizzle’s migration tooling and backup before deploy.  
- **Type Mismatches**:  
  • Drizzle ORM schemas vs. API payloads can drift.  
  • Mitigation: Enforce Zod validation on all incoming requests.  
- **Mobile UI Limitations**:  
  • Assistant-UI components may not render optimally on small screens.  
  • Mitigation: Test and adjust breakpoints and font sizes.

---

This document outlines everything the AI model and developers need to build and extend the Everything-App platform without ambiguity. All future technical documents (Tech Stack details, Frontend Guidelines, Backend Structure, App Flow, File Structure, IDE rules) should reference these requirements directly.