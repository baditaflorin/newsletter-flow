# 0046 - Performance Budgets

## Status

Accepted

## Context

Real feeds and OPML lists can be large. Phase 2 must be honest about performance.

## Decision

Budgets:

- Small inputs under 500 KB: useful preview under 1 second.
- Medium inputs under 2 MB: preview under 2 seconds.
- Large synthetic 10x fixtures: no crash; operation is cancellable or stale-safe.
- Operations over 300 ms record performance metadata.

The fixture suite records parse durations. The app caches inference results by input fingerprint.

## Consequences

Performance is measured on real fixtures and visible in debug mode.

## Alternatives Considered

Moving all parsing to a worker was considered but deferred until measurement proves main-thread parsing is the bottleneck.
