# Phase 2 Substance Performance Plan

Budgets are defined in ADR 0046.

The substance fixture suite records parse durations for every fixture. Final before/after numbers are reported in `docs/postmortem-phase2-substance.md`.

Target:

- Median fixture analysis under 1 second.
- p95 fixture analysis under 2 seconds.
- 10x synthetic feed does not crash and produces a recoverable/cancellable result.

## Final Measurement

Measured locally on 2026-05-09 with the 10 committed real-data fixtures.

- Median fixture analysis: 10.37 ms.
- p95 fixture analysis: 25.32 ms.
- Worst fixture analysis: 25.32 ms.
- UI work that can exceed 300 ms exposes analyzing/importing state and cancellable operations.

| Fixture                | Kind       | Shape             | Sources | Issues | Duration |
| ---------------------- | ---------- | ----------------- | ------: | -----: | -------: |
| 01 product brief       | idea_brief | brief             |       1 |      0 |  3.43 ms |
| 02 NASA RSS            | rss        | feed              |       3 |      0 | 25.32 ms |
| 03 W3C RSS             | rss        | feed              |      20 |      1 | 10.37 ms |
| 04 Simon Willison Atom | atom       | release_notes     |      20 |      1 | 12.67 ms |
| 05 React Releases Atom | atom       | release_notes     |       4 |      0 | 23.97 ms |
| 06 Hacker News RSS     | rss        | aggregator_feed   |       5 |      0 |  0.89 ms |
| 07 Web Dev OPML        | opml       | subscription_list |      12 |      1 |  1.04 ms |
| 08 URL-only source     | url        | url_only_source   |       1 |      1 |  0.44 ms |
| 09 article HTML        | html       | article_html      |       1 |      0 |  0.50 ms |
| 10 truncated NASA RSS  | rss        | truncated_feed    |       1 |      2 | 11.22 ms |
