# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs idea capture, research management, drafting, polishing, image planning, export formatting, and subject line generation without a backend.

## Decision

Use a feature-first frontend architecture under `src/features/`. Shared logic lives under `src/lib/`, persistent models live under `src/db/`, and UI primitives live under `src/components/`.

Primary boundaries:

- `features/workspace`: project state orchestration and persistence.
- `features/research`: source ingestion, RSS parsing, search indexing, and citation selection.
- `features/drafting`: outline, draft, polish, and local LLM calls.
- `features/exports`: Substack Markdown, X thread, LinkedIn post, and JSON export.
- `features/audience`: segments and subject line variants.
- `features/images`: image brief, prompt, and asset selection helpers.

## Consequences

Feature code can evolve independently while shared logic stays small and testable. No module may directly reach into another feature's persistence details.

## Alternatives Considered

A route-first structure was rejected because v1 is a single workspace screen. A global utilities folder only was rejected because the app has several distinct workflows.
