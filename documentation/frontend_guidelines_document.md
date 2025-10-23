# Frontend Guideline Document

This document provides a clear overview of the frontend setup for the "everything-app" project. It is written in everyday language to help anyone—technical or not—understand how the frontend is put together, why certain choices were made, and how you can maintain or extend it.

## 1. Frontend Architecture

### 1.1 Overview

- **Framework**: Next.js (App Router) is the backbone. It handles page routing, server-side rendering, API routes, and layouts in one unified structure.
- **Language**: React with TypeScript ensures type safety across components and services.
- **Styling**: Tailwind CSS provides utility-first styles, while **shadcn/ui** offers pre-built, customizable React components.
- **AI Integration**: Vercel’s `@ai-sdk` and the `assistant-ui` library power the real-time AI chat interface.
- **Authentication**: `better-auth` manages sign-up, sign-in, and session handling.
- **Data Layer**: Drizzle ORM connects to a PostgreSQL database, offering type-safe queries.
- **Deployment**: Optimized for Vercel, with a standalone Docker mode for flexible hosting.
- **Developer Tools**: ESLint (linting), Prettier (formatting), and a `code-guide` CLI for scaffolding and code consistency.

### 1.2 Scalability, Maintainability, Performance

- **Modular Routes & API**: Each feature (chat, auth, keys) gets its own directory under `app/api/`, making it easy to add or modify endpoints.
- **Server vs. Client Components**: Next.js lets us choose between server-rendered and client-rendered components. Heavy data fetching stays on the server, while interactive pieces run on the client for snappy UX.
- **Type Safety**: TypeScript and Drizzle ORM minimize runtime errors, so you catch issues earlier.
- **Utility-First Styling**: Tailwind’s JIT compiler generates only the CSS you use, keeping bundle sizes small.
- **Docker-Ready**: The `output: 'standalone'` setting allows building small, self-contained images for any container platform.

## 2. Design Principles

We follow these guiding principles to create a user-friendly, accessible, and robust interface:

- **Usability**: Clear layouts and intuitive navigation. Primary actions (send message, sign in) are easy to find.
- **Accessibility**: Semantic HTML, proper aria attributes, focus management, and color contrast checks to support all users.
- **Responsiveness**: Mobile-first design with responsive breakpoints, ensuring a seamless experience on phones, tablets, and desktops.
- **Consistency**: Shared components and themes avoid visual drift. Every button or form field looks and behaves predictably.
- **Performance Mindset**: Lazy-load non-critical components, optimize images, and minimize bundle sizes for fast load times.

These principles are realized by:

- Using `shadcn/ui` components that come with built-in accessibility features.
- Applying Tailwind’s responsive utility classes (`sm:`, `md:`, `lg:`) to adjust layouts.
- Regularly auditing with Lighthouse to keep performance and accessibility in check.

## 3. Styling and Theming

### 3.1 Styling Approach

- **CSS Methodology**: Utility-first with Tailwind CSS. We avoid verbose class names by composing small, focused utilities.
- **Component Library**: `shadcn/ui` provides headless, themeable components (buttons, inputs, dialogs) that can be customized via Tailwind.
- **Global Styles**: A minimal `globals.css` file handles base styles and resets; most styling lives in component-level classes.

### 3.2 Theming

- **Dark Mode**: Enabled via a `theme-provider` component. Users can toggle between light and dark. Styles are controlled with the `dark:` prefix in Tailwind.
- **Consistency**: All colors, fonts, and spacing come from the Tailwind theme (configured in `tailwind.config.ts`).

### 3.3 Visual Style

- **Design Style**: Modern, flat design with subtle shadows and rounded corners. Focus on clarity and simplicity rather than heavy skeuomorphism.
- **Glassmorphism Accents**: Light frosted-glass effect for modals or sidebars (optional, via Tailwind backdrop filters).

### 3.4 Color Palette

| Name         | Hex       | Usage              |
|--------------|-----------|--------------------|
| Primary      | #4F46E5   | Primary buttons    |
| Secondary    | #10B981   | Links, accents     |
| Background   | #F9FAFB   | Light mode bg      |
| Background   | #111827   | Dark mode bg       |
| Surface      | #FFFFFF   | Cards, panels      |
| Surface      | #1F2937   | Dark mode panels   |
| Text Primary | #111827   | Headlines, labels  |
| Text Secondary| #6B7280  | Secondary text     |

### 3.5 Typography

- **Font Family**: `Inter`, a versatile, modern sans-serif.
- **Font Scale**: Defined in Tailwind’s theme (e.g., `text-sm`, `text-base`, `text-lg`, `text-xl`).

## 4. Component Structure

### 4.1 Organization

- **`components/`**: All reusable UI pieces.
  - **`components/ui/`**: Wraps `shadcn/ui` exports (Button, Input, etc.).
  - **`components/assistant-ui/`**: Chat-specific UI from the `assistant-ui` library (threads, attachments, markdown output).
  - **App-Specific**: `api-key-manager.tsx`, `app-sidebar.tsx`, `auth-buttons.tsx`, `chat-session-manager.tsx`, `model-selector.tsx`, `site-header.tsx`, `theme-toggle.tsx`.

### 4.2 Reuse and Composition

- Build small, focused components that do one thing well.
- Pass data and callbacks via props to maximize flexibility.
- Group related parts into folders to keep things tidy.

### 4.3 Benefits of Component-Based Architecture

- **Maintainability**: Fix or improve one component and it updates everywhere.
- **Discoverability**: Clear naming and folder structure make it easy to find what you need.
- **Reusability**: Share common UI logic without duplication.

## 5. State Management

### 5.1 Current Approach

- **Local State**: `useState` and `useEffect` for component-level state (e.g., form inputs, toggles).
- **Context API**: A `chat-runtime-provider` handles streaming chat state and shares it with child components.

### 5.2 Global State Needs

- As features grow (attachments, model selection, preferences), consider a lightweight library:
  - **Zustand** or **Jotai** for simple global stores.
  - **React Context + useReducer** for scoped global logic.

### 5.3 Data Fetching

- Use Next.js server actions and fetch calls inside server components for initial data.
- In client components, use `fetch()` or `SWR`/`React Query` for dynamic lists (e.g., chat sessions, API keys).

## 6. Routing and Navigation

- **App Router**: File-based routing under `app/`. Each folder with a `page.tsx` becomes a route.
- **Nested Layouts**: Shared layouts (e.g., authenticated vs. public) live in `app/layout.tsx` and `app/(auth)/layout.tsx`.
- **API Routes**: Under `app/api/`, with subfolders for `auth`, `chat`, and `keys`.
- **Linking**: Use Next.js’s `<Link>` component for client-side navigation and prefetching.

### Navigation Structure

- Public routes: `/sign-in`, `/sign-up`.
- Private routes (after auth): `/dashboard`, `/chat`.
- Side menu and header guide users to chat, API keys, and future tools.

## 7. Performance Optimization

- **Server Components**: Keep heavy operations on the server to reduce client bundle size.
- **Code Splitting**: Next.js automatically splits chunks per page. For non-essential widgets, use `next/dynamic`.
- **Lazy Loading**: Dynamically import large components (e.g., the markdown renderer).
- **Image Optimization**: Use Next.js `<Image>` for built-in resizing, lazy loading, and format selection.
- **Tailwind JIT**: Only generates CSS classes you actually use.
- **Caching**: Leverage HTTP caching headers on API responses and static assets for repeat visits.

## 8. Testing and Quality Assurance

### 8.1 Unit Tests

- **Tools**: Jest or Vitest + React Testing Library.
- **Targets**: Utility functions (`lib/`), helper modules, individual React components.

### 8.2 Integration Tests

- **Tools**: Supertest (for API routes), combined with an in-memory database or test database.
- **Targets**: Endpoints in `app/api/auth`, `app/api/chat`, and `app/api/keys` to ensure correct responses and database interactions.

### 8.3 End-to-End (E2E) Tests

- **Tools**: Cypress or Playwright.
- **Flows**: User sign-up/sign-in, sending a chat message, switching themes, managing API keys.

### 8.4 Linting & Formatting

- **ESLint**: Enforces code style and catches common errors.
- **Prettier**: Auto-formats code on save or before commits.
- **Pre-commit Hooks**: Run linting and tests before allowing commits (via Husky or similar).

## 9. Conclusion and Overall Frontend Summary

This frontend follows a modern, modular pattern:

- Next.js handles routing, server rendering, and API routes in a unified structure.
- React + TypeScript enforces type safety and predictable UI behavior.
- Tailwind CSS + `shadcn/ui` delivers a consistent, accessible, and responsive design system with dark mode support.
- A clear folder structure (`app/`, `components/`, `lib/`, `db/`) makes onboarding and maintenance straightforward.
- Performance optimizations (server components, code splitting, caching) ensure a fast, smooth user experience.
- A robust testing setup (unit, integration, E2E) guarantees reliability as the app grows.

By following these guidelines, developers can confidently extend the "everything-app" frontend—adding new AI tools, refining the UI, and scaling to meet future needs—while keeping code quality and user experience high.