# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app needs durable local drafts and user settings while staying static.

## Decision

Use IndexedDB through Dexie for projects. Use localStorage only for small UI preferences that are safe to lose. Do not store secrets. Local LLM endpoints are ordinary URLs and are stored only when the user opts in.

## Consequences

Projects survive reloads and offline use. Browser storage clearing removes local projects, so JSON export remains important.

## Alternatives Considered

OPFS was considered for large files but is unnecessary for v1. localStorage-only persistence was rejected because drafts and sources can exceed comfortable string-storage limits.
