# 0067 - State-Management Convention

## Status

Accepted

## Context

The app currently uses React local state for UI state and Dexie for project persistence.

## Decision

Keep:

- Dexie for persisted projects
- React state for visible control state
- TanStack Query only for initial latest-project load
- URL hash only for explicit small-project share/import

Do not add a global state library in Phase 3.

## Consequences

State remains local-first and debuggable. Clear-state operations must go through the workspace persistence module.

## Alternatives Considered

Redux/Zustand were rejected because the app does not need cross-route state or complex subscriptions.
