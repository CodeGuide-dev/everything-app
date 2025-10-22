# Create app landing page with pricing plans

## Metadata

**Version:** 1.0

**Generated At:** Oct 21, 2025, 1:41 PM

## Task Summary

### Estimated Scope

This task involves creating a new primary route ('/') and replacing the existing `app/page.tsx`. It requires the development of several new, reusable React components for each section of the landing page (Navbar, Hero, Features, Pricing, Footer). Modifications to the root layout (`app/layout.tsx`) will be necessary to integrate the new global components like the Navbar and Footer. The scope does not include backend logic but focuses on UI/UX, component composition, and routing.

### Enriched Description

Develop a public-facing landing page to serve as the primary entry point for the 'everything-app'. This page is crucial for user acquisition and product communication. It must include a navigation bar, a hero section to capture user interest, a features section detailing the app's capabilities (AI Chat, Search, etc.), a pricing section with three distinct tiers (Free/BYOK, Monthly, Enterprise), and a footer. The page should be visually appealing, responsive, and provide clear calls-to-action (CTAs) to guide users towards the sign-up and sign-in flows.

### Original Description

Make a landing page for the app, it should have hero section, features section footer, navbar and pricing section. It has 3 plans, Free (bring your own key) or self-host since its open source, monthly of $20 and enterprise (contact us)

### Complexity Assessment

medium

## Repository Analysis

### Entry Points

1. app/page.tsx: The primary web entry point for new users.
2. app/layout.tsx: The root server component that wraps all pages.
3. app/api/auth/[...all]/route.ts: The authentication endpoint which the landing page will indirectly lead users to via sign-in/sign-up pages.

### Key Components

1. app/page.tsx: The main entry file that will be replaced.
2. app/layout.tsx: The root layout file that will need to be modified to include the new Navbar and Footer.
3. components/ui/*: The shadcn/ui library, which should be used extensively to build the new landing page components (e.g., Button, Card).
4. app/sign-in/page.tsx: The target page for the 'Sign In' CTA.
5. app/sign-up/page.tsx: The target page for the 'Sign Up' or 'Get Started' CTA.

### Technology Stack

1. Next.js (App Router)
2. React
3. TypeScript
4. Tailwind CSS
5. shadcn/ui
6. better-auth (for authentication context)

### Structure Overview

The repository is a standard Next.js 14 application utilizing the App Router. The `app/` directory contains all routes, with a clear separation between API endpoints (`app/api/`) and frontend pages (`app/chat/`, `app/dashboard/`). Reusable UI components are located in `components/`, with a distinction between application-specific components (`assistant-ui/`) and generic UI primitives (`ui/` from shadcn). The current `app/page.tsx` serves as the application's entry point and will be replaced by the new landing page.

### Architecture Patterns

1. Component-Based Architecture: The application is structured around reusable React components.
2. Server Components & Client Components: The Next.js App Router pattern is used, allowing for a mix of server-rendered static content and client-side interactivity.
3. API Route Handlers: Backend logic is handled via route handlers within the `app/api/` directory.

## Contextual Requirements

### Dependencies

1. The `better-auth` library for checking user authentication status in the Navbar.
2. The `shadcn/ui` component library for building UI elements like buttons, cards, and layout containers.
3. Next.js `next/link` or `<Link>` component for client-side navigation to authentication pages.

### Related Functionality

The landing page is tightly coupled with the user authentication system. The Navbar must conditionally render links based on the user's authentication state (e.g., show 'Sign In'/'Sign Up' for guests, and 'Dashboard' for logged-in users). The CTAs in the Hero and Pricing sections must link directly to the registration (`/sign-up`) and login (`/sign-in`) pages.

### Testing Considerations

Unit tests should be written for individual landing page components (e.g., PricingCard) to ensure they render correctly with different props. End-to-end (E2E) tests using a framework like Cypress or Playwright are critical to validate the user flow: verify all navigation links (Navbar, CTAs, Footer) work as expected, and check the page's responsive design across major breakpoints (mobile, tablet, desktop). Visual regression testing is recommended to prevent unintended UI changes.

### Deployment Considerations

As the main marketing page, it must be optimized for SEO and performance. All images should be optimized using `next/image`. The page should be statically generated (SSG) where possible to ensure fast load times and high Lighthouse scores. Ensure metadata (title, description) is properly set in `app/layout.tsx` or `app/page.tsx` for search engine visibility.

## Implementation Guidance

### Best Practices

1. Component Encapsulation: Keep each section of the landing page in its own component file for better organization and reusability.
2. Accessibility (a11y): Ensure all interactive elements are accessible by using semantic HTML and appropriate ARIA attributes.
3. Performance Optimization: Use static rendering for the landing page content. Optimize all assets, especially images, to ensure a fast initial page load.
4. Consistent Styling: Strictly adhere to the project's existing design system defined by Tailwind CSS and `shadcn/ui`.

### Suggested Approach

1. Create a new directory `components/landing` to encapsulate all new components for the page: `Navbar.tsx`, `HeroSection.tsx`, `FeaturesSection.tsx`, `PricingSection.tsx`, and `Footer.tsx`. 2. Leverage `shadcn/ui` components (e.g., `Card` for pricing tiers, `Button` for CTAs) to maintain visual consistency. 3. Overwrite the content of `app/page.tsx` to import and compose these new sections into the final landing page layout. 4. Modify `app/layout.tsx` to include the new `<Navbar />` and `<Footer />`. Consider using Next.js route groups to apply a different layout for marketing pages versus the authenticated application if needed. 5. Implement logic within the `Navbar` to check for an active user session and render links conditionally.

### Key Files To Modify

1. app/page.tsx
2. app/layout.tsx

### Potential Challenges

1. Stateful Navigation: Implementing the conditional logic in the Navbar to show different content for authenticated vs. unauthenticated users, especially within a Server Component context, may require careful state management or session handling.
2. Responsive Design: Ensuring a complex, multi-section layout is fully responsive and provides a seamless experience on all device sizes can be challenging and time-consuming.
3. Layout Scoping: Deciding whether the Navbar and Footer should be part of the root layout for all pages or only for unauthenticated marketing pages. This architectural decision impacts all other routes.

