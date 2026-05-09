# 0063 - Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

Phase 3 must finish, hide, or delete partial features rather than leaving confusing controls.

## Decision

| Feature                      | Decision            | Rationale                                                                    |
| ---------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| Project JSON backup/import   | Finish              | The engine exists and users need a backup/restore path.                      |
| Shareable state              | Finish              | Small projects can be transferred without a backend through URL hash state.  |
| Local LLM settings           | Finish and document | Existing controls are real but need honest limitations and error handling.   |
| URL-only import              | Finish guidance     | It is intentionally incomplete evidence; better guidance completes the path. |
| New project/reset            | Finish              | Users need demo, blank, and clear-local-data options with clear labels.      |
| Folder import                | Keep out of scope   | Too much platform variance for Phase 3.                                      |
| CSV/screenshot/embed exports | Keep out of scope   | Not necessary for newsletter publishing workflow.                            |

## Consequences

The UI can gain completion controls for existing workflows, but no new product surface beyond completing these pathways.

## Alternatives Considered

Deleting local LLM support was rejected because it is a core project promise and already has a real request path.
