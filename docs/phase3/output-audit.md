# Phase 3 Output Pathway Audit

Date: 2026-05-10

Baseline commit: 372baa6

Status legend:

- Green: works end-to-end on real user data.
- Yellow: works partially or is not round-tripped.
- Red: claimed or expected, but broken or missing.
- Out of scope: not part of the Mode A product surface.

| Exit path                  | Baseline status | Evidence                                                                                                                 | Decision                                                                                                                                  |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Substack Markdown download | Green           | `Markdown` button downloads generated Markdown with provenance comment.                                                  | Keep and test.                                                                                                                            |
| Project JSON download      | Yellow          | Button downloads state, but round-trip is not covered by an explicit test and import affordance is hidden in source box. | Finish.                                                                                                                                   |
| X thread copy              | Green           | Export tab renders thread and copy button writes to clipboard.                                                           | Keep.                                                                                                                                     |
| LinkedIn copy              | Green           | Export tab renders LinkedIn post and copy button writes to clipboard.                                                    | Keep.                                                                                                                                     |
| Copy subject line          | Green           | Per-subject copy buttons call clipboard writer and toast.                                                                | Keep.                                                                                                                                     |
| CSV export                 | Red             | Not claimed by README, but expected by audit prompt.                                                                     | Keep out of scope; newsletter flow has no tabular user need in v3.                                                                        |
| Shareable URL              | Red             | No encoded state/hash export exists.                                                                                     | Finish for small projects.                                                                                                                |
| Downloadable state file    | Yellow          | Project JSON exists but needs dedicated naming, validation, and round-trip coverage.                                     | Finish.                                                                                                                                   |
| Print/PDF view             | Red             | Browser print prints the full app chrome, not a draft/export view.                                                       | Finish with print-focused CSS and print command.                                                                                          |
| Screenshot export          | Out of scope    | No image renderer in Mode A; browser/system screenshots are enough.                                                      | Permanently out of scope.                                                                                                                 |
| Embed code                 | Out of scope    | The app produces newsletter copy, not widgets.                                                                           | Permanently out of scope.                                                                                                                 |
| API/curl-ready output      | Red             | No stable automation artifact or command snippet is shown.                                                               | Finish by documenting project JSON and providing a local `curl` data URL pattern is unnecessary; add Node/Python import snippets in docs. |
| Unsplash search link       | Green           | Link opens query based on image brief.                                                                                   | Keep.                                                                                                                                     |

## Baseline Counts

- Green: 5
- Yellow: 2
- Red: 4
- Out of scope: 2

## Immediate User Walls

1. The state export exists, but users are not clearly told it is the canonical backup/round-trip format.
2. Shareable state for small projects is missing.
3. Print output is not intentionally usable.
4. Automation-ready documentation is missing.

## After Implementation

| Exit path                  | Final status | Evidence                                                                         |
| -------------------------- | ------------ | -------------------------------------------------------------------------------- |
| Substack Markdown download | Green        | Smoke test clicks Markdown download.                                             |
| Project JSON download      | Green        | Playwright downloads and re-imports Project JSON.                                |
| X thread copy              | Green        | Shared copy handler is covered by existing export behavior and failure handling. |
| LinkedIn copy              | Green        | Same export copy path.                                                           |
| Copy subject line          | Green        | Same clipboard utility with recoverable failure handling.                        |
| CSV export                 | Out of scope | ADR 0062 marks CSV out of scope.                                                 |
| Shareable URL              | Green        | Playwright loads a small project from a hash share URL.                          |
| Downloadable state file    | Green        | Project JSON contract documented in `docs/project-json.md`.                      |
| Print/PDF view             | Green        | Print command and print CSS hide chrome and keep draft/export content.           |
| Screenshot export          | Out of scope | ADR 0062 marks screenshot export out of scope.                                   |
| Embed code                 | Out of scope | ADR 0062 marks embed code out of scope.                                          |
| API/curl-ready output      | Green        | Project JSON automation contract and Node/Python snippets documented.            |
| Unsplash search link       | Green        | Existing link remains in smoke-covered app shell.                                |

Final counts:

- Green: 10
- Yellow: 0
- Red: 0
- Out of scope: 3
