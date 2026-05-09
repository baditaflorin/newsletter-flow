# Phase 3 Input Pathway Audit

Date: 2026-05-10

Baseline commit: 372baa6

Live app: https://baditaflorin.github.io/newsletter-flow/

Status legend:

- Green: works end-to-end on real user data.
- Yellow: works partially or needs a clearer recovery path.
- Red: claimed or implied, but broken or missing.
- Out of scope: not part of the Mode A product surface.

| Entry point                          | Baseline status | Evidence                                                                                                          | Decision                                                                            |
| ------------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Manual idea fields                   | Green           | Working title, audience, angle, promise, and notes persist through IndexedDB autosave.                            | Keep.                                                                               |
| Manual source form                   | Yellow          | Adds notes/articles/RSS-shaped records, but title-only sources can still look usable until warnings are read.     | Finish with stronger evidence handling and tests.                                   |
| Paste text/HTML/XML/URL/project JSON | Green           | Phase 2 inference detects briefs, RSS, Atom, OPML, HTML, URL-only input, plain text, and exported project JSON.   | Keep.                                                                               |
| File upload                          | Red             | No file picker exists; users must open files elsewhere and paste text.                                            | Finish.                                                                             |
| Drag and drop                        | Red             | No drop target exists.                                                                                            | Finish.                                                                             |
| Multi-file import                    | Red             | No pathway exists for batch files or per-file errors.                                                             | Finish for text-like files.                                                         |
| Folder import                        | Out of scope    | Browser folder traversal would add permission and platform variance; not required for newsletter flow v1-v3.      | Permanently out of scope for Mode A unless an ADR reopens it.                       |
| Mobile file picker                   | Red             | No `input type=file`; mobile Files cannot be used directly.                                                       | Finish through the same file picker.                                                |
| Paste from clipboard permission API  | Red             | Clipboard write exists for exports, but no "read clipboard" input control exists.                                 | Finish with permission fallback guidance.                                           |
| Plain textarea paste fallback        | Green           | Source input textarea accepts pasted material and gives immediate preview.                                        | Keep.                                                                               |
| URL input                            | Yellow          | URL-only input is detected and honestly unselected, but users do not get a one-click path to paste rendered HTML. | Finish with domain guidance and tests; no runtime proxy.                            |
| Image input                          | Yellow          | Selected image URL can be pasted, and preview renders, but image file upload is not built.                        | Keep URL-only image input; mark local image file import out of scope for Mode A v3. |
| Sample/demo loader                   | Yellow          | Default project loads automatically; there is no explicit "reload demo" control separate from "New project."      | Finish by making demo/new project semantics explicit.                               |
| Deep links/imported state            | Red             | No hash state import or shareable state URL.                                                                      | Finish with compressed hash state within size limits.                               |
| Restored autosave                    | Green           | Latest project loads from Dexie; save status is visible.                                                          | Keep and test.                                                                      |
| Project JSON re-import               | Yellow          | Pasting project JSON into the source input replaces project state, but there is no dedicated import affordance.   | Finish with file/hash pathways and round-trip tests.                                |

## Baseline Counts

- Green: 4
- Yellow: 6
- Red: 6
- Out of scope: 1

## Immediate User Walls

1. A user with an RSS XML file, exported project file, or article HTML file cannot load it without opening another app and copying text.
2. A user with several source files cannot batch import and review partial success.
3. A user who receives a project from someone else has no obvious import or share-link path.
4. Clipboard import is asymmetric with clipboard export.
5. Mobile users cannot use the Files picker.

## After Implementation

| Entry point                          | Final status | Evidence                                                                       |
| ------------------------------------ | ------------ | ------------------------------------------------------------------------------ |
| Manual idea fields                   | Green        | Playwright fills fields, generates a draft, and reload persistence is covered. |
| Manual source form                   | Green        | Title-only sources are warning-backed and source evidence checks are shared.   |
| Paste text/HTML/XML/URL/project JSON | Green        | Phase 2 fixture suite remains the floor.                                       |
| File upload                          | Green        | Playwright imports real article HTML through `source-file-input`.              |
| Drag and drop                        | Green        | Same `importFiles` handler accepts dropped text-like files.                    |
| Multi-file import                    | Green        | Batch handler reads multiple files and reports imported/skipped/error rows.    |
| Folder import                        | Out of scope | ADR 0061 marks this permanently out of scope for Phase 3 Mode A.               |
| Mobile file picker                   | Green        | Browser file input uses `multiple` and text-like accepts for mobile Files.     |
| Clipboard read                       | Green        | `Read clipboard` handles permission failure with paste fallback.               |
| Plain textarea paste fallback        | Green        | Unchanged and tested through fixtures.                                         |
| URL input                            | Green        | URL-only remains unselected and guidance says to paste article text/HTML.      |
| Image input                          | Out of scope | ADR 0061 keeps local image file processing out of scope.                       |
| Sample/demo loader                   | Green        | Demo project and blank project are separate controls.                          |
| Deep links/imported state            | Green        | Share URL hash import is tested by Playwright.                                 |
| Restored autosave                    | Green        | Playwright reloads after file import and sees the imported source.             |
| Project JSON re-import               | Green        | Playwright downloads Project JSON and imports it through file input.           |

Final counts:

- Green: 14
- Yellow: 0
- Red: 0
- Out of scope: 2
