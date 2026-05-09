# 0043 - Domain Vocabulary And UI Language Conventions

## Status

Accepted

## Context

V1 errors used parser terms like "No RSS or Atom entries." Real users think in sources, feeds, article text, release notes, and evidence.

## Decision

All user-facing messages use newsletter-domain language:

- "source" instead of "record"
- "feed" instead of "XML document"
- "subscription list" instead of "OPML"
- "release notes" instead of "Atom entry" when detected
- "evidence" for selected sources used in a draft
- "recovered items" for partial imports

Developer terms remain in debug output only.

## Consequences

Errors and warnings become more actionable. Debug mode still exposes technical details.

## Alternatives Considered

Keeping technical parser labels was rejected because it makes recoverable failures feel like dead ends.
