# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The UI is the main product surface and needs strong typing, fast local development, and a reliable GitHub Pages build.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, lucide-react, zod, TanStack Query, Dexie, MiniSearch, and Vitest.

Vite builds directly into `docs/` with the base path `/newsletter-flow/` so GitHub Pages can serve the app from the repository project URL.

## Consequences

The initial bundle must remain small, and heavier AI or WASM modules must be lazy-loaded behind explicit user actions.

## Alternatives Considered

Svelte and Vue were viable, but React has the broadest ecosystem for this workflow. Next.js was rejected because static Pages hosting is simpler with Vite.
