# 0068 - Persistence Schema And Migration Policy

## Status

Accepted

## Context

Existing projects may have v1/v2 shapes. Phase 3 adds share and import pathways that rely on stable project state.

## Decision

`NewsletterProject` remains the canonical persisted shape. `PROJECT_SCHEMA_VERSION` moves to v3. Imports and stored projects are normalized through schema-aware functions that:

- preserve user content
- fill missing arrays/objects
- normalize sources with confidence/provenance
- add activity entries for migration/import

Project JSON exports wrap the project with metadata, but import accepts both wrapped and raw project shapes.

## Consequences

Old local data is migrated instead of lost. Share URLs and JSON files use the same validator.

## Alternatives Considered

Dropping old projects was rejected because local-first tools must respect browser state.
