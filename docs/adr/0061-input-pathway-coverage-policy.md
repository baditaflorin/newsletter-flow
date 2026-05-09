# 0061 - Input Pathway Coverage Policy

## Status

Accepted

## Context

Users bring files, pasted text, URLs, clipboard content, and exported state. Before Phase 3, paste was strong but file and clipboard pathways were absent.

## Decision

The app will support these Mode A input pathways:

- manual fields
- source textarea paste
- file picker for text-like source/project files
- drag-drop for text-like files
- multi-file batch import with per-file summaries
- clipboard read with permission fallback
- hash-based share state import
- IndexedDB autosave restore

Folder import and local image file processing are out of scope for Phase 3.

## Consequences

All file pathways route through the existing inference boundary. Large or binary files are rejected with actionable issues rather than attempted parsing.

## Alternatives Considered

Server-side URL fetching was rejected because it would require Mode C. Browser folder import was rejected because it adds platform-specific complexity without being necessary for newsletter source intake.
