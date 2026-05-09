# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

Phase 2 may remember user corrections within the session but must not feel spooky.

## Decision

Remember only transparent, session-scoped corrections:

- selection preference by source shape
- "review URL-only sources" remains unselected

The activity log records when a remembered preference is applied. Preferences are stored in component state only and reset on reload.

## Consequences

The app adapts within a session without creating hidden long-term behavior.

## Alternatives Considered

Persistent learning was rejected for Phase 2 because it needs a clearer privacy and reset model.
