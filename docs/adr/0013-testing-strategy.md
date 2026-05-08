# 0013 - Testing Strategy

## Status

Accepted

## Context

The project needs fast local checks without GitHub Actions.

## Decision

Use Vitest for TypeScript logic and React component tests. Use Playwright for one headless happy-path smoke test against the built Pages output. `make test`, `make build`, and `make smoke` are the pre-push gate.

## Consequences

Core generation, parsing, and export behavior is testable without a browser server. Smoke tests catch broken Pages output and base-path issues.

## Alternatives Considered

End-to-end-only testing was rejected because logic failures should be caught faster. Browserless-only testing was rejected because Pages publishing has real routing and asset concerns.
