# 0048 - Determinism And Reproducibility Guarantees

## Status

Accepted

## Context

Same input must produce the same normalized sources and exports.

## Decision

Use deterministic hashes for imported source IDs. Sort tags, warnings, and provenance fields deterministically. Inference output excludes ambient timestamps. Export metadata includes generation timestamp, but deterministic tests can supply a fixed timestamp.

## Consequences

Fixture runs can compare output contracts repeatedly. User exports carry enough metadata to explain their origin.

## Alternatives Considered

Random IDs were rejected for imported sources because they break round-trip and fixture determinism.
