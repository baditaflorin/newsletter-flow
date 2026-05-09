# State Taxonomy

Mode: GitHub Pages static app.

## Workspace States

- `loading`: IndexedDB is opening and the latest project is loading.
- `loaded-empty`: project exists but has no sources and no draft.
- `loaded-some`: project has at least one source or draft.
- `loaded-many`: project has more than 100 sources; list rendering and search must stay responsive.
- `saving`: debounced project save is pending.
- `saved`: last project save completed.
- `error-recoverable`: something failed but the current project remains intact.
- `error-fatal`: the app cannot continue without reload; user gets a recovery explanation.

## Import States

- `import-idle`: no import text is being analyzed.
- `import-analyzing`: current pasted input is being classified and normalized.
- `import-ready`: preview is ready and can be committed.
- `import-committing`: normalized sources/idea fields are being merged into the project.
- `imported-with-warnings`: import succeeded but warnings require review.
- `cancelled`: the active import was cancelled and no partial results were committed.

## Required Exits

- `loading` exits to a loaded state or recoverable error.
- `loaded-*` states allow edit, export, reset, and import.
- `saving` exits to `saved` or recoverable error.
- `import-analyzing` allows cancel.
- `import-ready` allows import, cancel, or edit input.
- `imported-with-warnings` allows reviewing warnings, editing sources, or importing more.
- `error-recoverable` allows retry, edit, reset, export current state, or dismiss.
- `error-fatal` allows reload and JSON recovery when project data is available.

No state may be reachable without at least one user-actionable exit.
