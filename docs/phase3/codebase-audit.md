# Phase 3 Codebase Health Audit

Date: 2026-05-10

Baseline commit: 372baa6

This is measurement only. No implementation changes are included in this audit.

## DRY Violations

| Area                      | Files                                                         | Baseline finding                                                                          | Decision                                           |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| HTML/entity normalization | `src/lib/text.ts`, `src/lib/input/normalize.ts`               | Two different entity maps and markup-stripping functions exist.                           | Consolidate around input normalization primitives. |
| Download/export naming    | `src/App.tsx`, `src/lib/downloads.ts`, `src/lib/generator.ts` | App owns download labels and export format knowledge while generator owns format content. | Add export helpers for state/share/print paths.    |
| Activity writes           | `src/App.tsx`                                                 | Repeated `updateProject(appendActivity(...))` patterns across handlers.                   | Extract app-local helpers or a workspace utility.  |
| Source evidence checks    | `src/App.tsx`, `src/lib/input/inference.ts`                   | Evidence selection rules and source evidence checks are split.                            | Add canonical source utility.                      |

## SOLID Violations

| Area                   | Baseline finding                                                                                                                    | Decision                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/App.tsx`          | Single module owns UI, import orchestration, settings, persistence callbacks, exports, activity creation, and local error handling. | Split practical utilities first; defer large UI component split to avoid churn. |
| `src/lib/generator.ts` | Drafting, analysis, image brief, subject lines, social exports, and metadata live in one file.                                      | Split only if needed by Phase 3 export work.                                    |
| `src/db/projects.ts`   | Database schema and migration normalization live together.                                                                          | Keep but add explicit migration policy and round-trip tests.                    |
| Boundary validation    | Project JSON import validates a partial envelope then casts the project.                                                            | Add stricter schema/narrowing for imported project state.                       |

## Dead Code

- No commented-out code blocks were found.
- No dormant feature flags were found.
- Re-export feature modules are thin but used by `App.tsx`; keep.
- `parseRssItems` remains a compatibility wrapper with tests; keep.

## TODO / FIXME / XXX / HACK

Count: 0 in `src/`, `tests/`, `README.md`, and hand-written docs excluding vendored dependencies and generated assets.

## Type Safety Holes

| Area                               | Baseline finding                                                                   | Decision                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `fromProjectJson`                  | `result.data.project as unknown as NewsletterProject` trusts nested project shape. | Replace with schema-backed project normalization. |
| XML parsing                        | `NodeRecord` casts are concentrated at parser boundary.                            | Accept as boundary code, document in ADR 0069.    |
| Export tab cast                    | `id as typeof activeExport` is safe but avoidable.                                 | Replace with typed export tab definitions.        |
| `event.target.value as SourceKind` | Safe from fixed select options but avoidable.                                      | Replace with schema/narrowing helper.             |
| Tests                              | `expect.any(Number)` is test matcher use, not product type unsafety.               | Accept.                                           |

## Inconsistent Patterns

1. Some recoverable failures use toast only; others use inline issues.
2. Clipboard failures are not handled like other recoverable errors.
3. Import state is explicit; export/copy/download state is mostly implicit.
4. Project JSON is treated as both source input and backup state without a dedicated naming convention.

## Test Coverage Holes

1. File import, drag-drop, and batch import are not tested because they do not exist.
2. Project JSON export/import round-trip is not tested end-to-end.
3. Autosave reload is not tested in Playwright.
4. Clipboard failure is not tested.
5. README feature claims are not mapped to tests.

## Baseline Counts

- DRY violations in core modules: 4
- SOLID violations: 4
- Dead code findings: 0
- TODO/FIXME/XXX/HACK: 0
- Type safety holes: 4 product holes, 1 accepted test matcher pattern
- Real-user path test holes: 5

## After Implementation

| Metric                                    | Baseline |               Final |
| ----------------------------------------- | -------: | ------------------: |
| DRY violations in core modules            |        4 |          1 accepted |
| SOLID violations requiring Phase 3 action |        4 |          1 accepted |
| Dead code findings                        |        0 |                   0 |
| TODO/FIXME/XXX/HACK                       |        0 |                   0 |
| Untracked product type-safety holes       |        4 |                   0 |
| Real-user path test holes                 |        5 | 0 for Phase 3 scope |

Resolved:

- Source evidence checks moved to `src/lib/sources.ts`.
- Project state validation moved to `src/lib/project-schema.ts`.
- Project JSON/hash IO moved to `src/lib/project-io.ts`.
- UI source-kind and export-tab casts were replaced by typed helpers.
- Project JSON import now goes through schema-backed normalization.

Accepted:

- XML parser casts remain boundary code under ADR 0069.
- `src/App.tsx` remains a large single-screen module; ADR 0064 rejects a broad component split in Phase 3 because it would add churn without directly improving stranger usability.
