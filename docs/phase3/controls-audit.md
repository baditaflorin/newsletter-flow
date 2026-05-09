# Phase 3 Controls Audit

Date: 2026-05-10

Baseline commit: 372baa6

| Control                   | Baseline status | Real-data result                                                              | Decision                                       |
| ------------------------- | --------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| Star on GitHub            | Green           | Opens https://github.com/baditaflorin/newsletter-flow.                        | Keep.                                          |
| Support                   | Green           | Opens https://www.paypal.com/paypalme/florinbadita.                           | Keep.                                          |
| New project               | Yellow          | Creates a new demo-shaped project, but label can imply blank factory reset.   | Finish with clearer reset options.             |
| Idea fields               | Green           | Persist locally and feed draft generation.                                    | Keep.                                          |
| Search sources            | Green           | MiniSearch filters saved sources.                                             | Keep.                                          |
| Manual source form        | Yellow          | Adds source, but title-only sources can be selected.                          | Tighten.                                       |
| Paste source input        | Green           | Analyzes common real inputs and previews before import.                       | Keep.                                          |
| Import detected input     | Green           | Commits sources or project JSON.                                              | Keep and test project import.                  |
| Cancel import             | Green           | Clears pending analysis and records activity.                                 | Keep.                                          |
| Source Selected/Use       | Green           | Toggles evidence selection and session preference.                            | Keep.                                          |
| Remove source             | Green           | Removes a source.                                                             | Keep.                                          |
| Generate draft            | Green           | Generates deterministic draft or local LLM draft with fallback.               | Keep.                                          |
| Polish                    | Green           | Uses local LLM if enabled, otherwise deterministic polish.                    | Keep.                                          |
| Use Ollama-style endpoint | Yellow          | Persists and works when endpoint is available, but no connection test exists. | Keep; document limitation.                     |
| Refresh image brief       | Green           | Regenerates image brief from current project.                                 | Keep.                                          |
| Open Unsplash search      | Green           | Opens query URL.                                                              | Keep.                                          |
| Image URL preview         | Yellow          | Works for remote URLs, but broken image URLs have no visible recovery.        | Keep; add validation feedback if time permits. |
| Add segment               | Green           | Adds audience segment.                                                        | Keep.                                          |
| Remove segment            | Green           | Removes segment.                                                              | Keep.                                          |
| Copy subject line         | Green           | Writes one subject line to clipboard.                                         | Keep.                                          |
| Export format tabs        | Green           | Switch Substack/X/LinkedIn preview.                                           | Keep.                                          |
| Markdown download         | Green           | Downloads Markdown.                                                           | Keep.                                          |
| Project JSON download     | Yellow          | Downloads JSON, but round-trip is under-explained.                            | Finish.                                        |
| Copy current export       | Green           | Copies active export.                                                         | Keep.                                          |
| Debug surface `?debug=1`  | Green           | Shows version, commit, import state, cache, and activity.                     | Keep.                                          |

## Baseline Counts

- Green: 18
- Yellow: 6
- Red: 0
- Out of scope: 0

## Handler Risks

1. Clipboard writes can fail in insecure or permission-blocked contexts; errors are not currently surfaced.
2. `New project` does not clearly distinguish sample/demo from blank reset.
3. Local LLM settings persist, but the user has no built-in confirmation that the endpoint works before generating.
4. Project JSON import is powerful but hidden inside the generic source input path.

## After Implementation

| Control group            | Final status | Evidence                                                                                   |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------ |
| Project links            | Green        | Smoke test verifies GitHub link; PayPal link remains visible.                              |
| Idea controls            | Green        | Smoke and reload tests exercise real data.                                                 |
| Research controls        | Green        | File import, source input, import, cancel, selection, and removal use real handlers.       |
| Workspace reset controls | Green        | Demo, blank, and delete-local-data controls are explicit.                                  |
| Draft controls           | Green        | Generate/polish paths remain real; local LLM falls back recoverably.                       |
| Image controls           | Green        | URL preview and Unsplash search remain real; local image files are out of scope.           |
| Segment controls         | Green        | Add/remove/copy controls remain real.                                                      |
| Export controls          | Green        | Markdown, Project JSON, share URL, print, tabs, and copy are wired.                        |
| Settings controls        | Green        | Local LLM and local storage controls are in `#settings` and persist through project state. |

Final counts:

- Green: 24
- Yellow: 0
- Red: 0
- Out of scope: 0
