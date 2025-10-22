# AI Development Agent Guidelines

## Project Overview
**Project:** everything-app
**** Here is the enhanced repository summary, tailored to your build goals for the "everything-app".

***

## Comprehensive Repository Summary: everything-app

This repository, `everything-app`, serves as a robust full-stack starter template built with Next.js, providing a solid foundation for a modern, multi-feature AI platform. It has been analyzed and enhanced to specifically support the development of a "super app" that merges features like AI Chat, AI Search, and AI Image Generation, starting with the AI Chat functionality.

### 1. What this codebase does (purpose and functionality)

The core purpose of `everything-app` is to accelerate the development of a sophisticated AI application by providing a pre-configured, feature-rich starting point. Its primary functionalities, both existing and planned, include:

*   **Foundation for AI Features**: The starter provides the essential architecture to build out the target features:
    *   **AI Chat (Initial Focus)**: The immediate goal is to integrate a multi-modal chat interface using **Vercel's `@ai-sdk`** for model interaction and **`assistant-ui`** for the user interface.
    *   **AI Search (Future)**: The architecture supports adding a new search feature with AI-powered summaries.
    *   **AI Image Generation (Future)**: The structure is ready for integrating image generation models like Google's Nano Banana.
*   **User Authentication**: Implements sign-up and sign-in processes using the `better-auth` library, which is critical for managing user-specific chat histories, preferences, and saved content across all AI features.
*   **Dashboard**: Offers a protected area accessible post-authentication. This will serve as the central hub for users to access the AI Chat, Search, and other tools.
*   **Modern UI**: Integrates `shadcn/ui` and Tailwind CSS. This is a significant advantage, as `assistant-ui` is built on these same technologies, ensuring seamless visual and technical integration.
*   **Theming**: Supports dark mode and provides a flexible theming system, enhancing user experience.
*   **Database ORM**: Configured with Drizzle ORM for type-safe interaction with PostgreSQL, essential for storing chat histories, user settings, and generated content.

### 2. Key Architecture and Technology Choices

The architecture is a typical Next.js full-stack application, perfectly suited for building interactive, real-time AI experiences.

*   **Frontend**:
    *   **Next.js**: The overarching framework, providing file-based routing that will be used to create distinct pages for each AI feature (e.g., `/chat`, `/search`).
    *   **React**: The core library for building the dynamic user interfaces required for AI interaction.
    *   **TypeScript**: Ensures type safety across the entire codebase, which is crucial for managing the complex data structures of AI interactions (e.g., chat messages, model parameters).
    *   **shadcn/ui & Tailwind CSS**: Provides a highly customizable and accessible design system. This existing setup will make integrating `assistant-ui` straightforward and visually consistent.
*   **Backend**:
    *   **Next.js API Routes**: These are the ideal mechanism for creating the backend endpoints that will power the AI features. For example, a new API route will be created to handle streaming chat responses from language models via `@ai-sdk`.
    *   **Better Auth**: A flexible authentication library integrated for user management.
    *   **Drizzle ORM**: A modern, type-safe ORM for PostgreSQL. This will be used to persist chat threads, messages, and user preferences related to AI models.
*   **Deployment & Tooling**:
    *   **Vercel**: The recommended platform, offering seamless integration with Next.js and first-party support for the `@ai-sdk`.
    *   **Docker**: Provides containerization for consistent development and production environments.
    *   **Prettier & ESLint**: For maintaining code consistency and quality as the application grows.

### 3. Main Components and How They Interact

The codebase is organized logically, providing a clear path for integrating the new AI features.

*   **`app/` Directory**: The heart of the application. The AI Chat feature will be built here by creating a new route like `app/chat/[[...threadId]]/page.tsx`.
    *   `dashboard/page.tsx`: This page will be adapted to become the main container for the AI tools, likely hosting the `assistant-ui` component as the primary feature.
    *   `api/auth/[...all]/route.ts`: This existing route serves as a perfect template for creating the new AI backend endpoint at `app/api/chat/route.ts`.
*   **`components/` Directory**: Houses reusable React components.
    *   `ui/`: Contains `shadcn/ui` components that can be used to build out the UI for model selection, attachment uploads, and other chat-related features.
    *   `app-sidebar.tsx`, `site-header.tsx`: These core layout components can be easily modified to include navigation links to the different AI features (Chat, Search, etc.).
*   **`lib/` Directory**: Contains utility functions and configurations. This is where the `@ai-sdk` client-side hooks and utilities can be co-located.
*   **`db/` Directory**: Dedicated to the database. The immediate next step will be to add a new schema file, e.g., `db/schema/chat.ts`, to define tables for storing chat threads and messages.

**AI Chat Interaction Flow**:
A user, after logging in, will navigate to the AI Chat section within the `/dashboard`. Interactions with the `assistant-ui` component will trigger API calls to the new `/api/chat` endpoint. This endpoint, using `@ai-sdk`, will communicate with the selected AI model, stream the response back to the client, and persist the conversation history to the PostgreSQL database using the extended Drizzle ORM schema.

### 4. Notable Patterns, Configurations, or Design Decisions

The starter's design decisions provide a strong tailwind for developing the `everything-app`.

*   **Next.js App Router**: Ideal for creating the distinct, feature-rich pages required for the app. It also supports advanced layouts and data fetching patterns suitable for AI applications.
*   **Component-Driven Development**: This approach is perfect for building the `everything-app`, as each AI feature (Chat, Search, Image Generation) can be encapsulated as a distinct set of modular components.
*   **Type-Safe Full-Stack**: The use of TypeScript with Drizzle ORM is a major asset. It will ensure that the data models for chat messages, user preferences, and API responses are consistent and error-free from the database to the UI.
*   **Standalone Output for Docker**: The `output: 'standalone'` configuration in `next.config.ts` is beneficial for creating efficient, production-ready container images.

### 5. Overall Code Structure and Organization

The repository's structure is well-suited for the planned expansion and clearly separates concerns.

*   **`app/`**: New AI features will live here as pages (e.g., `app/chat/`) and their corresponding backend logic (e.g., `app/api/chat/`).
*   **`components/`**: Custom components for the AI features, such as a model selector or a file attachment UI, will be placed here.
*   **`db/`**: The database schema will be extended here to support new features (e.g., adding `chat.ts` to the `schema/` folder).
*   **`lib/`**: This is a great place to centralize AI-related logic, such as creating a client for `@ai-sdk`.

This clear separation makes it intuitive to add new vertical features without disrupting existing ones.

### 6. Code Quality Observations and Recommendations

The starter exhibits good code quality, providing a solid base to build upon. The following recommendations are tailored for building a robust AI application.

*   **Comprehensive Testing**: As AI features are added, it will be critical to write integration tests for the API endpoints that interact with `@ai-sdk` to handle various model responses, streaming behavior, and potential errors.
*   **Enhanced Error Handling**: This is especially important for the AI features, which will need to gracefully handle API rate limits, model timeouts, or content filtering from AI providers. Implement user-friendly feedback mechanisms within the `assistant-ui` for such events.
*   **Robust Input Validation**: Ensure comprehensive validation on the `/api/chat` endpoint to sanitize inputs, check attachment types/sizes, and prevent prompt injection attacks.
*   **Environment Variable Validation**: Use a library like `zod` to validate environment variables at startup. This is crucial for managing multiple AI provider API keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, etc.) securely and reliably.

### 7. Roadmap and Customization for 'everything-app'

The following are key areas for extension and customization to realize the vision for the `everything-app`.

*   **Centralized State Management**: As the application grows, managing the state of the AI Chat (current conversation, model selection, attachments) will become complex. This becomes a high-priority item. **Actionable Insight**: Introduce a state management library like **Zustand** early on to manage client-side state efficiently.
*   **Database Schema Expansion**: The immediate next step is to model and implement the database schema for the chat feature. **Actionable Insight**: In `db/schema/`, create a `chat.ts` file defining tables for `threads` (to group messages) and `messages` (with content, role, and a foreign key to `threads` and `users`).
*   **API Client Abstraction**: To support multiple AI features, create a dedicated service layer for interacting with different AI APIs. This will abstract the specifics of `@ai-sdk` for chat, a future search provider's API, and the Nano Banana image generation API, keeping the core application logic clean.
*   **Background Jobs**: For potentially long-running AI tasks (e.g., generating a detailed analysis or a high-resolution image), consider integrating a background job processor like Inngest to avoid serverless function timeouts and improve user experience.
*   **Component Composition Refinement**: The `dashboard/page.tsx` will evolve into a complex layout. Plan its composition to allow for switching between different AI tools while maintaining a consistent frame (sidebar, header).

This starter provides an excellent and well-architected foundation. By integrating `@ai-sdk` and `assistant-ui` and methodically expanding the database and API layers as outlined, you can efficiently build the powerful, multi-feature `everything-app`.

## CodeGuide CLI Usage Instructions

This project is managed using CodeGuide CLI. The AI agent should follow these guidelines when working on this project.

### Essential Commands

#### Project Setup & Initialization
```bash
# Login to CodeGuide (first time setup)
codeguide login

# Start a new project (generates title, outline, docs, tasks)
codeguide start "project description prompt"

# Initialize current directory with CLI documentation
codeguide init
```

#### Task Management
```bash
# List all tasks
codeguide task list

# List tasks by status
codeguide task list --status pending
codeguide task list --status in_progress
codeguide task list --status completed

# Start working on a task
codeguide task start <task_id>

# Update task with AI results
codeguide task update <task_id> "completion summary or AI results"

# Update task status
codeguide task update <task_id> --status completed
```

#### Documentation Generation
```bash
# Generate documentation for current project
codeguide generate

# Generate documentation with custom prompt
codeguide generate --prompt "specific documentation request"

# Generate documentation for current codebase
codeguide generate --current-codebase
```

#### Project Analysis
```bash
# Analyze current project structure
codeguide analyze

# Check API health
codeguide health
```

### Workflow Guidelines

1. **Before Starting Work:**
   - Run `codeguide task list` to understand current tasks
   - Identify appropriate task to work on
   - Use `codeguide task update <task_id> --status in_progress` to begin work

2. **During Development:**
   - Follow the task requirements and scope
   - Update progress using `codeguide task update <task_id>` when significant milestones are reached
   - Generate documentation for new features using `codeguide generate`

3. **Completing Work:**
   - Update task with completion summary: `codeguide task update <task_id> "completed work summary"`
   - Mark task as completed: `codeguide task update <task_id> --status completed`
   - Generate any necessary documentation

### AI Agent Best Practices

- **Task Focus**: Work on one task at a time as indicated by the task management system
- **Documentation**: Always generate documentation for new features and significant changes
- **Communication**: Provide clear, concise updates when marking task progress
- **Quality**: Follow existing code patterns and conventions in the project
- **Testing**: Ensure all changes are properly tested before marking tasks complete

### Project Configuration
This project includes:
- `codeguide.json`: Project configuration with ID and metadata
- `documentation/`: Generated project documentation
- `AGENTS.md`: AI agent guidelines

### Getting Help
Use `codeguide --help` or `codeguide <command> --help` for detailed command information.

---
*Generated by CodeGuide CLI on 2025-10-21T14:12:03.469Z*
