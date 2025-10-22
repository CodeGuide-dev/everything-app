# Hero Section Improvement Plan

This plan upgrades the marketing hero using three reusable UI components from `21dev-hero.md`:

- `components/ui/aurora-background.tsx` – animated background wrapper
- `components/ui/flip-words.tsx` – animated word flipper for headlines
- `components/ui/hero-with-text-and-two-button.tsx` – reference hero layout (optional demo/pattern)

## Objectives
- Improve visual impact and motion of the landing hero.
- Keep CTAs and copy accessible, responsive, and lightweight.
- Maintain compatibility with existing shadcn/ui, Tailwind v4, and React 19.

## Implementation Summary
- Added the three UI components under `components/ui/`.
- Updated `components/landing/HeroSection.tsx` to wrap content with `AuroraBackground` and animate part of the headline with `FlipWords`.
- Extended `app/globals.css` with minimal CSS variables and an `animate-aurora` utility to support the background effect under Tailwind v4.

## Files Touched
- `components/ui/aurora-background.tsx`
- `components/ui/flip-words.tsx`
- `components/ui/hero-with-text-and-two-button.tsx`
- `components/landing/HeroSection.tsx`
- `app/globals.css`

## Step-by-Step
1) Add UI components
- Create files per `21dev-hero.md` and adapt imports for our stack:
  - Use `import { AnimatePresence, motion } from "motion/react";` instead of `framer-motion` to match the repo’s dependency.
  - Use existing `cn` from `lib/utils.ts` and `Button` from `components/ui/button`.

2) Tailwind v4 utilities
- Define animation keyframes and utility directly in `app/globals.css`:
  - `@keyframes aurora { ... }`
  - `@utility animate-aurora { animation: aurora 60s linear infinite; }`
- Add required CSS variables for the aurora gradient colors in `:root` (e.g., `--blue-500`, `--indigo-300`, etc.).

3) Compose the hero
- In `components/landing/HeroSection.tsx`:
  - Wrap existing hero content with `<AuroraBackground className="py-24">`.
  - Replace part of the headline with `<FlipWords words={["chat", "knowledge", "automations"]} />`.
  - Keep existing CTAs linking to `/sign-up` and `/sign-in`.
  - Preserve the highlights grid for quick value props.

4) Accessibility & Responsiveness
- Maintain semantic heading structure, focus states, and color contrast.
- Ensure animated elements don’t obstruct content or controls.

## Validation
- Start dev server: `npm run dev`.
- Verify:
  - Hero renders with the animated aurora background.
  - Headline cycles through flip words smoothly.
  - CTAs navigate correctly.
  - No layout shift across breakpoints.

## Notes & Alternatives
- If you prefer to keep the original gradient, set a custom `className` on `AuroraBackground` to reduce intensity or provide a non-animated path.
- `hero-with-text-and-two-button.tsx` is included as a reference pattern and can be swapped in for experiments or A/B tests.
- The repo already includes `motion` (Framer Motion v12). If migrating examples, prefer `motion/react` imports.

## Future Enhancements
- Add reduced-motion handling to pause animations when `prefers-reduced-motion` is enabled.
- Add a small logo strip or trust badges beneath the CTAs.
- Add hero image or product preview with `next/image` for better engagement and LCP.

