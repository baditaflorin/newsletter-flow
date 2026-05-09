# Phase 2 Substance Plan

Date: 2026-05-09

Baseline audit: https://github.com/baditaflorin/newsletter-flow/blob/main/docs/phase2-substance/realdata-audit.md

This plan ranks substance work by impact on the 10 real-data inputs. It does not add new product surfaces or change the deployment mode.

## Ranked Picklist

1. **#6 Auto-detect structure** — detect brief, RSS, Atom, OPML, URL-only, HTML, plain article text, truncated XML, malformed XML, and empty input before import.
2. **#8 Useful first guess on first input** — pasted input should immediately produce a preview contract: inferred type, sources, idea fields, warnings, and confidence.
3. **#16 Confidence scores on every inference** — source title, URL, date, summary, tags, selection, input type, and export confidence.
4. **#32 Actionable errors** — every failure uses what/why/next-step copy in newsletter/source language.
5. **#33 Validate at boundaries** — zod schemas for imported projects and normalized inference results.
6. **#9 Format normalization by default** — dates to ISO where possible, URLs absolute when a base exists, whitespace collapsed, entities decoded, tags normalized.
7. **#13 Recognize common shapes** — feed, release/changelog feed, aggregator feed, OPML subscription list, article HTML, article text, idea brief.
8. **#15 Domain conventions baked in** — semantic feed fields, canonical URLs, aggregator comments URLs, changelog versions, article headings.
9. **#18 Surface anomalies** — cap disclosure, empty-source warnings, truncated input, metadata-only summaries, missing dates, mixed feed shapes.
10. **#17 Suggest fixes** — "paste article text", "import OPML feed URLs", "review capped items", "select relevant sources", "add a base URL".
11. **#14 Domain-aware export** — exports include provenance, app version, schema version, source IDs, confidence summary, and generation parameters.
12. **#35 Deterministic outputs** — same input and same project state produce byte-identical normalized source contracts and exports except explicit generation timestamp fields.
13. **#38 Output provenance** — every exported artifact carries source IDs, input kind, confidence, and parameters.
14. **#21 Lossless round-trip** — JSON export can be re-imported into the same project schema without losing source IDs or confidence.
15. **#22 Stable IDs everywhere** — deterministic source IDs for imported inputs, human-readable enough for export/provenance.
16. **#2 Encoding and format variants** — normalize UTF-8 BOM, CRLF, NBSP, smart quotes, HTML entities, and common control characters.
17. **#4 Partial inputs** — recover complete RSS/Atom items where possible and warn on truncation.
18. **#5 Adversarial input** — malformed HTML/XML and URL-only input must not produce confident empty evidence.
19. **#1 Fuzz the parser** — real-data fixtures plus five synthetic edge cases run through the inference engine without crashes.
20. **#3 Huge inputs** — define size budgets and test 1x/5x/10x feed repetition without freezing.
21. **#24 Enumerate reachable states** — document loading, loaded-empty, loaded-some, importing, imported-with-warnings, error-recoverable, error-fatal, saving, saved, cancelled.
22. **#25 No stuck states** — every import/error/progress state offers at least one exit.
23. **#26 Cancellation actually cancels** — import/analysis operations use AbortController and do not commit partial state after cancellation.
24. **#27 Concurrency safety** — repeated imports/drafts are serialized or explicitly ignored while a newer operation owns the state.
25. **#28 Profile real-data inputs** — collect median/p95/worst parse timings for the fixtures and document them.
26. **#31 Cache expensive things** — cache normalized input analysis by deterministic input fingerprint.
27. **#34 Recoverable vs fatal explicit** — recoverable errors keep work intact; fatal errors offer export/current-state recovery.
28. **#36 Inspectable history** — persist an activity log for imports, generation, polish, exports, cancellations, and recoverable errors.
29. **#37 Debug overlay** — `?debug=1` exposes state, recent activity, fixture-like inference, cache stats, and performance marks.
30. **#39 Remember user corrections within session** — if the user changes imported source selection, similar source kinds default to that choice for the session.
31. **#19 Explain decisions** — expose short reasoning strings for type detection, confidence, selected state, and warnings.
32. **#11 Domain vocabulary in the UI** — replace parser/data-structure wording with "feed", "article", "source", "evidence", "release notes", "subscription list".

## Commit Strategy

Each implementation slice will be committed separately with Conventional Commits. Fixture and ADR commits are separate setup commits. Generated Pages output is rebuilt and committed when the app behavior changes.

## Definition Of Done

- At least 7 of 10 real-data fixtures pass the primary flow without manual intervention.
- Every fixture has a `.expected.json` contract.
- The fixture test suite runs in `make test`.
- ADRs 0040-0050 are present where relevant.
- Pass-rate trend is updated after implementation.
- `make lint`, `make test`, `make smoke`, `npm audit --audit-level=high`, and `gitleaks detect` pass.
- Version is bumped to `0.2.0` and tagged `v0.2.0`.
