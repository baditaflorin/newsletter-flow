# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Browser-only workflows can fail due to CORS, invalid RSS XML, unavailable local LLM endpoints, or storage limits.

## Decision

Use typed result helpers for expected failures. Display actionable inline errors near the relevant workflow and also route unexpected failures through a global error boundary.

Do not swallow errors silently. Do not panic or throw from event handlers when a recoverable message can be shown.

## Consequences

Users can continue writing when optional flows fail. Tests can assert clear error messages.

## Alternatives Considered

Global toast-only errors were rejected because many writing errors need local context.
