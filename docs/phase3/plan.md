# Phase 3 Completeness Plan

Date: 2026-05-10

Baseline commit: 64af7f4

Priority is based on whether a stranger can use their own material end-to-end without help.

## Picklist

1. **#1 File input works** - add a file picker for source/project files.
2. **#2 Format detection on files** - route pasted/dropped/uploaded text through the existing input inference.
3. **#4 Multi-file batch import** - read multiple text-like files and merge previews with per-file results.
4. **#5 Mobile file picker** - same file input must work on mobile Files.
5. **#6 Clipboard read** - add "Read clipboard" with permission fallback.
6. **#7 Demo and user data first-class** - distinguish demo project, blank project, and imported project.
7. **#8 Resume/start fresh** - keep autosave, add blank reset and delete-local-data paths.
8. **#9 Export round-trip** - project JSON download/import returns the same canonical state.
9. **#10 Copy confirmations/failures** - clipboard success and failure are both visible and recoverable.
10. **#11 Downloadable state file** - make project JSON the documented backup format.
11. **#12 Shareable URL** - hash-encoded state for small projects with documented limit.
12. **#13 Print/PDF view** - add print-focused draft/export command and CSS.
13. **#14 Automation-ready output** - document stable JSON contract and Node/Python snippets.
14. **#15 Half-baked triage** - decide finish/hide/delete for every partial feature.
15. **#16 Finish kept half-baked items** - project JSON, local LLM limits, URL-only guidance, reset controls.
16. **#18 Settings completeness** - make LLM and workspace settings real controls.
17. **#19 Help/docs alignment** - README claims become verified or removed.
18. **#20 DRY extraction** - consolidate source evidence and export helpers.
19. **#22 Canonical domain types** - keep one `NewsletterProject` and add import schema validation.
20. **#23 Shared validation schemas** - reuse project schema at JSON/hash/file boundaries.
21. **#24 Split god-module helpers** - move source/input/export utilities out of `App.tsx`.
22. **#28 Dead code pass** - remove obsolete docs claim and any unused code found after refactor.
23. **#31 Error handling convention** - apply recoverable error pattern to import/copy/share.
24. **#33 Naming consistency** - typed export tabs and source-kind parsing.
25. **#35 Remove unsafe casts** - replace project import and UI option casts with narrowers.
26. **#36 Validate boundaries** - source files, hash import, project JSON import.
27. **#38 Save really saves** - Playwright reload test.
28. **#39 Migrations** - schema v3 with normalization from v1/v2.
29. **#40 Clear state operations** - reset demo, blank project, delete local data.
30. **#41 Round-trip restores state** - unit and e2e coverage.
31. **#42 README verified checklist** - map claims to tests.
32. **#43 Quickstart check** - keep Makefile path and smoke coverage.
33. **#44 Inline help** - minimal domain hints for file import, URL-only, local LLM, share limits.
34. **#45 Honest limitations** - README limitations section.
35. **#46 Stranger test** - private-browser real input walkthrough.
36. **#47 Fix top 3 stranger-test issues** - address immediately before release.

## Commit Batches

1. Audit docs.
2. Plan docs.
3. ADRs 0060-0071.
4. Input completeness.
5. Output completeness.
6. Persistence and schema validation.
7. Codebase health and type safety.
8. Tests and docs alignment.
9. Stranger test, postmortem, version bump, Pages build, tag.

## Acceptance Gates

- `make lint`
- `make test`
- `make smoke`
- `npm audit --audit-level=high`
- `gitleaks detect --no-git --redact --source .`
- Live Pages render check after push
