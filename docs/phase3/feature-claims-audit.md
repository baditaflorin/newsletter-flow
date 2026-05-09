# Phase 3 Feature Claims Audit

Date: 2026-05-10

Baseline commit: 372baa6

Sources audited: `README.md`, in-app copy, ADRs, and postmortems.

| Claim                                                      | Baseline status | Evidence                                                                                 | Decision                                          |
| ---------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Local-first writing desk                                   | Green           | Static Pages app; projects stored in browser.                                            | Keep.                                             |
| Captures idea, audience, angle, promise, notes             | Green           | Idea fields exist and persist.                                                           | Keep.                                             |
| Imports manual sources or pasted RSS/Atom XML              | Green           | Manual form and source input work.                                                       | Update claim to include Phase 2 formats.          |
| Searches sources locally with MiniSearch                   | Green           | `searchSources` uses MiniSearch and tests exist.                                         | Keep.                                             |
| Generates Markdown draft locally                           | Green           | `composeDraft` and draft button work.                                                    | Keep.                                             |
| Optional BYO Ollama-style local LLM support                | Yellow          | Request path exists, but no endpoint health test and CORS limitations are not in README. | Keep with limitation.                             |
| Runs readability, hedge, passive-voice, polish checks      | Green           | Draft analysis and polish helpers work.                                                  | Keep.                                             |
| Produces Substack, X, LinkedIn formats                     | Green           | Exports render and are downloadable/copyable.                                            | Keep.                                             |
| Audience-specific subject lines                            | Green           | Segment-based subject lines render and copy.                                             | Keep.                                             |
| Builds image brief with Unsplash search link               | Green           | Image brief and link exist.                                                              | Keep.                                             |
| Persists projects in IndexedDB                             | Green           | Dexie storage exists and loads latest project.                                           | Keep and test.                                    |
| Shows version and commit metadata                          | Green           | Footer and hero show version/commit.                                                     | Keep.                                             |
| Offline-friendly PWA                                       | Yellow          | Service worker and manifest exist; no offline smoke test covers cached shell.            | Keep claim with a narrower wording unless tested. |
| Phase 2 postmortem says no API failed requests             | Green           | Static commit metadata removed GitHub API call.                                          | Keep.                                             |
| Phase 1 postmortem says commit was fetched from GitHub API | Red             | That changed in commit 372baa6.                                                          | Correct documentation drift.                      |

## Baseline Counts

- Green: 12
- Yellow: 2
- Red: 1

## Documentation-Reality Mismatches

1. README undersells the real input formats after Phase 2.
2. README lacks limitations for local LLM, URL-only sources, and arbitrary article fetching.
3. Phase 1 postmortem still references the removed GitHub commits endpoint.
4. Project JSON is not described as the canonical backup/round-trip format.
5. No README test directly proves project JSON round-trip or restored autosave.
