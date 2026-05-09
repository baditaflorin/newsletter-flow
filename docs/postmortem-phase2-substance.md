# Phase 2 Substance Postmortem

Date: 2026-05-09

Version: v0.2.0

Repository: https://github.com/baditaflorin/newsletter-flow

Live app: https://baditaflorin.github.io/newsletter-flow/

## Summary

Phase 2 changed the same v1 workflow underneath: idea capture, source import, draft generation, polish, and export. The main surface is still the writer desk, but pasted real-world inputs now get classified before import and every inferred source carries confidence, reasoning, issues, and provenance.

## Real-Data Pass Rate

Baseline clean pass rate: 2/10.

Final clean pass rate: 8/10.

Partial but recoverable: 2/10.

Fails or misleads: 0/10.

| Fixture                | Before         | After   | Evidence                                                                              |
| ---------------------- | -------------- | ------- | ------------------------------------------------------------------------------------- |
| 01 product brief       | Partial        | Pass    | Classified as idea brief, extracts title/audience/angle/promise/notes.                |
| 02 NASA RSS            | Cleanup needed | Pass    | Imports dated feed items with source metadata and confidence.                         |
| 03 W3C RSS             | Partial        | Pass    | Discloses 25 found, 20 imported, 5 skipped.                                           |
| 04 Simon Willison Atom | Partial        | Pass    | Classifies as release notes, discloses cap, preserves entry URLs and dates.           |
| 05 React Releases Atom | Partial        | Pass    | Classifies release-note shape and tags technical/changelog sources.                   |
| 06 Hacker News RSS     | Partial        | Pass    | Classifies aggregator feed, separates discussion URL, avoids selecting all items.     |
| 07 Web Dev OPML        | Fail           | Partial | Detects OPML and extracts feed candidates; still cannot fetch nested feeds in Mode A. |
| 08 URL-only source     | Fail           | Partial | Detects URL-only input and leaves it unselected with a next step.                     |
| 09 article HTML        | Fail           | Pass    | Detects HTML/article shape and extracts readable title/content.                       |
| 10 truncated NASA RSS  | Fail           | Pass    | Recovers complete item content and warns about truncation.                            |

## Top 5 Logic Gaps Closed

1. No input-shape detection: closed with deterministic detection for idea briefs, RSS, Atom, OPML, HTML, URL-only input, project JSON, plain text, empty input, and malformed XML.
2. No confidence model: closed with per-source confidence labels, numeric confidence, reasoning bullets, and issue severity.
3. Lossy silent source import: closed with normalization reports, found/imported/skipped counts, truncation warnings, normalized dates, stable IDs, and provenance metadata.
4. No relevance ranking: improved with deterministic selection defaults by source shape and current idea matching; aggregator and URL-only sources no longer all enter as selected evidence.
5. Errors do not explain recovery: closed with domain issues carrying what happened, why it matters, and the next step.

## Smart Behaviors Delivered

- Pasting a freeform product brief produces structured idea fields and a source candidate without extra setup.
- Pasting RSS, Atom, OPML, article HTML, plain text, or a URL produces a typed preview before import.
- Every inferred source shows confidence, source type, reasoning, issues, and provenance.
- Weak evidence is not silently selected: empty URL-only inputs and low-evidence aggregator items stay out of the draft by default.
- Exports include schema version, app version, generated timestamp, source IDs, confidence summary, and generation parameters.

## Determinism Check

All 10 fixtures pass deterministic-output tests. Repeated runs produce the same input kind, source shape, source IDs, confidence labels, issue codes, and normalized source fields. Export metadata still includes a generated timestamp by design, so deterministic tests compare the normalized inference output rather than wall-clock metadata.

## Performance

Measured locally on 2026-05-09 against `test/fixtures/realdata/`.

- Median fixture analysis: 10.37 ms.
- p95 fixture analysis: 25.32 ms.
- Worst fixture analysis: 25.32 ms.
- All measured fixture analyses are well below the 1 second median and 2 second p95 budgets.
- Main-thread responsiveness is protected with analyzing/importing states, operation IDs, and cancellation for the import path.

Detailed table: https://github.com/baditaflorin/newsletter-flow/blob/main/docs/perf/phase2-substance.md

## What Surprised Me

- The most damaging v1 failures were not parser crashes; they were empty or weak sources that looked authoritative enough to draft from.
- OPML is not rare for the target workflow. Newsletter writers who curate feeds can realistically paste subscription lists, not just individual RSS feeds.
- URL-only input is better treated as an honest incomplete source than as a broken import. Leaving it unselected makes the app feel more trustworthy.
- The capped feed behavior was useful technically but harmful without disclosure. A small issue line changes the user's mental model completely.

## Phase 3 Substance Candidates

1. Fetch URL/article content through a user-supplied local proxy or browser-friendly extraction path without adding a hosted backend.
2. Add richer relevance scoring that understands the idea promise, audience, and angle instead of matching mostly by terms.
3. Preserve code blocks and structured release-note sections instead of flattening everything into summary text.
4. Add importable/exportable correction memory so user overrides can survive reloads while staying local-first.
5. Add a virtualized preview for very large OPML/feed imports and a clearer import cap editor.

## Honest Take

It no longer feels like a toy on the 10 real-data fixtures. The app now makes a useful first guess, admits uncertainty, and avoids the worst wrong-confident behavior. It is still not a full research assistant because Mode A cannot fetch arbitrary article pages through CORS, and relevance ranking is heuristic rather than semantic. The big change is trust: when the app does not know enough, it now says so in the workflow instead of quietly drafting from weak evidence.
