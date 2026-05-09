# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

Phase 2 requires no stuck, half-imported, or ambiguous states.

## Decision

Document and implement explicit import/workspace states:

- `loading`
- `loaded-empty`
- `loaded-some`
- `loaded-many`
- `saving`
- `saved`
- `import-idle`
- `import-analyzing`
- `import-ready`
- `import-committing`
- `imported-with-warnings`
- `error-recoverable`
- `error-fatal`
- `cancelled`

Long or repeatable operations get an operation ID. Results from stale operations are ignored.

## Consequences

Double-clicks and cancellation have defined behavior. UI messages can be mapped to states.

## Alternatives Considered

Implicit boolean flags were rejected because they caused unclear combinations.
