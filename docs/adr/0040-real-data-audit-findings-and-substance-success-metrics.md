# 0040 - Real-Data Audit Findings And Substance Success Metrics

## Status

Accepted

## Context

The Phase 2 audit found that v1 works on curated demo data but becomes brittle with messy newsletter inputs: freeform briefs, RSS/Atom feeds, OPML lists, URL-only sources, HTML fragments, changelog feeds, aggregator feeds, and truncated XML.

## Decision

Use the 10 real-data fixtures in `test/fixtures/realdata/` as the Phase 2 grading rubric. The primary success metric is improving the clean pass rate from 2/10 to at least 7/10 without changing deployment mode or adding a backend.

Each fixture has a sibling `.expected.json` contract. The substance test suite asserts input kind, shape, confidence, source count, warning codes, provenance, and no selected empty evidence.

## Consequences

Implementation work is ranked by real-data impact. A change that makes a fixture worse is blocked unless a new ADR explains the tradeoff.

## Alternatives Considered

Continuing with curated demo tests was rejected because it would not address the "toy" failure mode.
