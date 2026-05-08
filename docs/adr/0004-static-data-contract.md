# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no shared backend data. The app still needs stable local project schemas and import/export contracts.

## Decision

Use versioned local documents persisted in IndexedDB:

- Database name: `newsletter-flow`
- Schema version: `1`
- Store: `projects`
- Primary key: `id`

Project documents contain `idea`, `sources`, `segments`, `draft`, `imageBrief`, `exports`, `settings`, `createdAt`, and `updatedAt`.

Exports use JSON schema version `newsletter-flow.project.v1`. Markdown exports are generated from current project state and are not persisted as authoritative source data.

## Consequences

The app can import/export projects without a server. Breaking changes require a new schema version and migration path.

## Alternatives Considered

Static JSON committed to the repo was rejected because user writing state is private. A runtime database was rejected because cross-device sync is not a v1 requirement.
