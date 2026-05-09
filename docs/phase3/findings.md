# Phase 3 Findings Synthesis

Date: 2026-05-10

Baseline commit: 372baa6

## Top 5 Usability Gaps

1. Users cannot load real files directly; they must open files elsewhere and paste text.
2. Users cannot batch import several research files and see per-file success/errors.
3. Project JSON round-trip exists but is hidden and under-tested.
4. No shareable URL exists for small projects, so handoff requires a downloaded file.
5. Print/PDF output is not intentional; browser print includes too much app chrome.

## Top 5 Half-Baked Features

| Feature                    | Decision        | Reason                                                                                          |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Project JSON backup/import | Finish          | Already implemented underneath; needs first-class affordance and tests.                         |
| Local LLM settings         | Finish/document | Works only if the user's local endpoint and CORS setup allow it; keep with honest limits.       |
| New project                | Finish          | Current label can imply blank/factory reset; users need demo, blank, and clear-state semantics. |
| URL-only source import     | Finish/document | It is honest but needs clearer next step: paste rendered HTML/text.                             |
| Offline PWA claim          | Finish/document | Keep PWA assets; add a direct limitation and smoke coverage where practical.                    |

## Top 5 Codebase Pain Points

1. `src/App.tsx` is the coordination bottleneck for UI, imports, exports, persistence, and activity.
2. Project import validation is too shallow for a canonical state format.
3. Normalization logic is duplicated between text and input modules.
4. Export format definitions are scattered between generator and UI controls.
5. Error handling is inconsistent for clipboard/download/import failures.

## Top 5 Documentation-Reality Mismatches

1. README does not mention OPML, HTML, URL-only, plain text, or project JSON inference.
2. README does not describe project JSON as the backup/round-trip state file.
3. README lacks local LLM limitations.
4. Phase 1 postmortem says live commit is fetched through GitHub API, but the app now uses static build metadata.
5. No limitations section explains why arbitrary article URL fetching is not done in Mode A.

## Definition Of Fully Usable

1. A stranger can open the live URL, import their own source material from paste, file picker, drag-drop, or project JSON, and see a useful preview.
2. They can generate, edit, polish, and export a newsletter draft without losing state on reload.
3. They can leave with Markdown, platform copy, a project backup file, and a shareable small-project URL.
4. Every visible control either completes its labeled job or explains the limitation in domain terms.
5. Documentation matches the live product and names the sharp edges honestly.

## Success Metrics

1. Input audit after implementation: at least 10 green rows, 0 red rows, remaining gaps marked out of scope by ADR.
2. Output audit after implementation: at least 8 green rows, 0 red rows, remaining gaps marked out of scope by ADR.
3. Controls audit after implementation: 0 red rows and no yellow row without a mitigation.
4. Real-data fixture suite remains green.
5. Playwright covers file import, project JSON round-trip, restored autosave, export download/copy, and share-link load.
6. Codebase audit after implementation: 0 TODO/FIXME/XXX/HACK, 0 untracked type-safety holes, and DRY violations reduced or explicitly accepted.
7. README claims each map to a test or are removed.

## Out Of Scope

- Runtime backend, proxy server, auth, sync, or secrets.
- Hosted LLMs or hosted article scraping.
- Visual polish, command palette, dark mode, animation, landing-page work, or Open Graph images.
- Local image file processing beyond URL preview.
- CSV exports, screenshot exports, embed widgets, and folder import for Phase 3.
- Changes to the Phase 2 inference engine behavior except boundary validation needed for completeness.
