# 0017 - Dependency Policy

## Status

Accepted

## Context

The app replaces several SaaS tools but must stay maintainable and secure.

## Decision

Use production-ready libraries for common concerns:

- React and Vite for UI and build.
- Tailwind CSS for styling.
- zod for validation.
- TanStack Query for async state and caching.
- Dexie for IndexedDB.
- MiniSearch for local search.
- fast-xml-parser for RSS XML parsing.
- lucide-react for icons.
- Vitest and Playwright for tests.

Avoid custom implementations where a stable library already solves the problem. Run `npm audit` before release and keep high/critical vulnerabilities at zero.

## Consequences

The app is faster to build and easier to trust. Dependencies must be reviewed before adding new ones.

## Alternatives Considered

Hand-rolled search, storage wrappers, and RSS parsers were rejected because they would increase bug risk.
