# 0065 - Module Boundaries And Dependency Direction

## Status

Accepted

## Context

The app is a single-page Mode A workspace. Boundaries need to stay simple but explicit.

## Decision

Dependency direction:

1. UI: React components and browser event handling.
2. Features: re-export use-case APIs.
3. Domain libraries: parsing, generation, search, project IO, validation.
4. Primitives: IDs, text helpers, downloads.

Domain libraries must not import UI components. Database code may import domain validation and demo creation, but UI must not touch Dexie directly.

## Consequences

The frontend stays small and understandable. Boundary validation moves out of `App.tsx`.

## Alternatives Considered

A full clean-architecture directory split was rejected as too heavy for this app size.
