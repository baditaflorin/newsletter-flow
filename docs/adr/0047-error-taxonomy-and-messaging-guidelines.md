# 0047 - Error Taxonomy And Messaging Guidelines

## Status

Accepted

## Context

Errors need a what, why, and next step.

## Decision

Every warning/error has:

- `code`
- `severity`
- `what`
- `why`
- `nextStep`

Recoverable errors keep current project data intact. Fatal errors must offer export/reload recovery.

## Consequences

Tests can assert error quality. Users get domain guidance instead of stack traces.

## Alternatives Considered

Plain strings were rejected because they cannot be reliably audited.
