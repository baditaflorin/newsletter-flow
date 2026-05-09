# 0062 - Output Pathway Coverage Policy

## Status

Accepted

## Context

The app already produced Markdown, X, LinkedIn, and project JSON, but project state was not a first-class round-trip format and small share links were missing.

## Decision

Phase 3 output pathways are:

- Markdown download
- project JSON download and import
- copy current platform export
- copy subject lines
- shareable URL for small projects
- print/PDF through browser print with print CSS
- documentation for automation-ready project JSON

CSV, screenshot export, and embed code are out of scope.

## Consequences

Project JSON becomes the canonical state file. Share links are size-limited and use URL hash state, not a server token.

## Alternatives Considered

Short-link servers and release-hosted state artifacts were rejected because private user projects must not leave the browser unless the user exports them.
