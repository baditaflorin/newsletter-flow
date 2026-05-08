# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

Mode A must not expose secrets in the frontend.

## Decision

All build-time configuration is public. Runtime preferences are stored locally in the browser. `.env.example` documents public Vite variables only. `.env*`, private keys, and certificate files are gitignored. Gitleaks runs in the pre-commit hook.

## Consequences

No API key is bundled. Any future integration that requires a secret must be implemented outside the frontend or moved to a new deployment mode ADR.

## Alternatives Considered

Encrypted frontend secrets were rejected because shipped client secrets are still public.
