# 0011 - Logging Strategy

## Status

Accepted

## Context

There is no server in Mode A, but developer diagnostics are still useful.

## Decision

Production code avoids noisy console output. Recoverable user-facing failures are shown inline or via the global toast. Development-only logs may be guarded by `import.meta.env.DEV`.

## Consequences

Users get clear errors without leaking project data into logs. There are no centralized logs.

## Alternatives Considered

Client log collection was rejected for privacy and because v1 has no analytics backend.
