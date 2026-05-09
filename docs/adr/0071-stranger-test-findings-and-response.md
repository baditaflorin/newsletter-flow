# 0071 - Stranger-Test Findings And Response

## Status

Accepted

## Context

The Phase 3 stranger test must prove a fresh user can complete the workflow with their own input.

## Decision

Use a private-browser walkthrough with real fixture data and no preloaded local state. Record:

- import confusion
- first useful preview
- draft generation
- export/state backup
- reload restore
- share-link restore

Fix the top three issues before tagging v0.3.0.

## Consequences

The final postmortem must answer whether a stranger can use the app end-to-end with zero help.

## Alternatives Considered

Skipping the test was rejected. Using only automated smoke tests was rejected because confusion and dead ends are product failures, not just code failures.
