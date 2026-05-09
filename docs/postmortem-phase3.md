# Phase 3 Completeness Postmortem

Date: 2026-05-10

Version: v0.3.0

Repository: https://github.com/baditaflorin/newsletter-flow

Live app: https://baditaflorin.github.io/newsletter-flow/

## Summary

Phase 3 made the existing workflow usable with a stranger's own data. The app stayed Mode A on GitHub Pages and did not add a backend. The biggest changes were file/clipboard/share/project-state pathways, tested round-trip persistence, clearer reset/settings controls, and documentation that now matches the product.

## Audit Grids

| Audit           | Baseline green | Baseline yellow | Baseline red | Final green | Final yellow | Final red | Out of scope |
| --------------- | -------------: | --------------: | -----------: | ----------: | -----------: | --------: | -----------: |
| Input pathways  |              4 |               6 |            6 |          14 |            0 |         0 |            2 |
| Output pathways |              5 |               2 |            4 |          10 |            0 |         0 |            3 |
| Controls        |             18 |               6 |            0 |          24 |            0 |         0 |            0 |
| Feature claims  |             12 |               2 |            1 |          15 |            0 |         0 |            0 |

## Half-Baked Feature Triage

| Feature                      | Outcome             | Rationale                                                                                 |
| ---------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| Project JSON backup/import   | Finished            | Now documented as canonical state and covered by unit/e2e round-trip tests.               |
| Shareable state              | Finished            | Small projects can be shared through URL hash state with a visible manual-copy fallback.  |
| Local LLM settings           | Finished/documented | Kept as BYO local endpoint; limitations and fallback are explicit in Settings and README. |
| URL-only import              | Finished/documented | Still unselected evidence, now paired with guidance to paste article text/HTML.           |
| New project/reset            | Finished            | Demo, blank, and delete-local-data controls are separate.                                 |
| Folder import                | Out of scope        | ADR 0061 keeps it out for Mode A Phase 3.                                                 |
| CSV/screenshot/embed exports | Out of scope        | ADR 0062 keeps them out because they are not core newsletter exits.                       |

## Codebase Health

| Metric                                    | Before |               After |
| ----------------------------------------- | -----: | ------------------: |
| DRY violations in core modules            |      4 |          1 accepted |
| SOLID violations requiring Phase 3 action |      4 |          1 accepted |
| Dead code findings                        |      0 |                   0 |
| TODO/FIXME/XXX/HACK                       |      0 |                   0 |
| Untracked product type-safety holes       |      4 |                   0 |
| Real-user path test holes                 |      5 | 0 for Phase 3 scope |

The remaining accepted duplication is parser-boundary XML casting and the large single-screen `App.tsx`. ADR 0064 rejects a broad component split for this phase because it would not directly improve stranger usability.

## Stranger Test

Recorded in `docs/phase3/stranger-test.md`.

Top 3 issues fixed:

1. Share URL copied but was not visible if clipboard failed: added visible read-only share URL output.
2. Same-tab share hash navigation did not restore state: added `hashchange` handling.
3. Blank/demo reset could race first typing: project state now switches synchronously before persistence catches up.

## Documentation-Reality Fixes

- README now names the real input formats and tested paths.
- README now documents Mode A limitations for CORS, local LLM endpoints, share URL size, and out-of-scope exports.
- `docs/project-json.md` documents the automation-ready state contract.
- `docs/postmortem.md` no longer claims the app still uses the GitHub commits API for live commit metadata.
- Phase 3 audit docs include before/after grids.

## Test Evidence

- `make lint`
- `make test`
- `make smoke`
- Playwright smoke now covers homepage, file import plus reload restore, Project JSON export/import, and share URL import.
- Phase 2 real-data fixture tests still pass.

## What Surprised Me

- The most important usability fixes were not visual. They were boring exits and entrances: file input, state backup, share URL, reload restore.
- Same-tab hash navigation is a real product path. A share link can fail even when fresh-page loading works.
- A tiny async race on Blank project could erase the first keystroke. That is exactly the kind of thing a demo misses and a stranger hits.

## Still-Open Completeness Gaps

1. The app does not fetch arbitrary article URLs because Mode A cannot make that reliable without a backend.
2. Folder import remains out of scope.
3. Local image file import/editing remains out of scope.
4. The UI is still a large single-screen module internally, even though the user-facing workflow is now complete.
5. Share URLs are intentionally size-limited; large projects need Project JSON.

## Honest Take

Yes, a stranger can now use the app for their own real newsletter work end-to-end if their data is in the supported browser-local formats: paste, text-like files, Project JSON, or small share URLs. They can import, draft, polish, export platform copy, back up state, restore it, and reload without losing work.

The answer is still no for workflows that require hosted article scraping, cross-device sync, folder import, or local image editing. Those are explicitly outside Mode A Phase 3, not hidden missing pieces.
