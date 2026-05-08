# 0012 - Metrics And Observability

## Status

Accepted

## Context

Mode A has no server-side metrics. Usage analytics would add privacy and consent work.

## Decision

Ship with no analytics. Observability consists of local UI health states, test coverage, smoke tests, and visible version/commit metadata in the footer.

## Consequences

There is no behavioral tracking and no PII collection. Product learning comes from user feedback and GitHub issues.

## Alternatives Considered

Plausible and a Cloudflare Worker beacon were considered but rejected for v1.
