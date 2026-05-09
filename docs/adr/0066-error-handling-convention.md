# 0066 - Error-Handling Convention

## Status

Accepted

## Context

Phase 2 input errors use domain issues, but clipboard, file, and share failures were not yet consistent.

## Decision

Recoverable UI failures must tell the user:

- what failed
- why it probably failed
- what to do next

Implementation uses toast summaries plus inline/domain issue details where the user can act. Silent `catch` blocks are allowed only for non-critical best-effort PWA registration.

## Consequences

File, clipboard, share, import, and local LLM failures become understandable and do not destroy local work.

## Alternatives Considered

Throwing raw errors into the UI was rejected because browser permission and CORS errors are not domain language.
