# 0070 - Documentation-Reality Alignment Process

## Status

Accepted

## Context

The README and postmortems drifted after Phase 2 metadata and inference work.

## Decision

Every README feature claim must be either:

- covered by unit/e2e/smoke tests, or
- narrowed/removed in the same phase.

Limitations are first-class documentation, especially Mode A limitations around CORS, local LLM endpoints, and browser-only storage.

## Consequences

Documentation becomes a product contract. The README will link to Phase 3 audit and postmortem docs.

## Alternatives Considered

Leaving aspirational claims was rejected because Phase 3 is explicitly about completeness.
