# 0064 - DRY Consolidation Map

## Status

Accepted

## Context

The codebase has small but meaningful duplication in source evidence checks, export state helpers, entity cleanup, and activity writes.

## Decision

Phase 3 consolidates:

- source evidence helpers into `src/lib/sources.ts`
- project JSON/hash state validation into `src/lib/project-schema.ts`
- export and share utilities into `src/lib/project-io.ts`
- typed UI option helpers where casts existed

Markup normalization duplication is accepted temporarily because `src/lib/text.ts` is draft analysis oriented while `src/lib/input/normalize.ts` is parser-boundary oriented.

## Consequences

Core behavior becomes easier to test directly. `App.tsx` remains the single screen but loses boundary logic.

## Alternatives Considered

A large component split was rejected for Phase 3 because it risks churn without directly improving stranger usability.
