# 0069 - Type-Safety Policy At Boundaries

## Status

Accepted

## Context

The main unsafe product hole is project JSON import. XML parser output still necessarily enters as unknown records.

## Decision

External data boundaries use Zod or explicit narrowing:

- project JSON
- hash share state
- source file manifests
- select option values

XML parser `NodeRecord` casts remain accepted boundary code because `fast-xml-parser` returns untyped records.

## Consequences

The app can reject invalid imported state without crashing or silently mutating shape.

## Alternatives Considered

Hand-written deep validators were rejected because Zod is already in the dependency set.
