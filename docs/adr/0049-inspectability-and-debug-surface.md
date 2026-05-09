# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Confidence and inference are more trustworthy when users and maintainers can inspect decisions.

## Decision

Add `?debug=1` debug output showing:

- app version and fallback commit
- project ID
- import state
- last inference kind and shape
- warnings
- performance timings
- cache stats
- recent activity log

Debug mode is read-only and contains no hidden secrets.

## Consequences

Power users can diagnose behavior without a backend.

## Alternatives Considered

Console-only debugging was rejected because production console output should stay minimal.
