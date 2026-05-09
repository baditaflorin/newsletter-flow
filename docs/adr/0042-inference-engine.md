# 0042 - Inference Engine

## Status

Accepted

## Context

The app needs a useful first guess from common newsletter inputs without asking the user to configure import mode first.

## Decision

Add a deterministic inference engine that classifies inputs as:

- `idea_brief`
- `rss`
- `atom`
- `opml`
- `html`
- `url`
- `plain_text`
- `empty`
- `unknown`

It also infers shapes such as `feed`, `release_notes`, `aggregator_feed`, `subscription_list`, `article_html`, `url_only_source`, and `truncated_feed`.

Inference uses explicit heuristics: XML roots, feed item tags, OPML outline attributes, HTML article/title/canonical tags, URL patterns, workflow/cost vocabulary, version patterns, HN comments links, and truncation markers.

## Consequences

The app can show a preview and import report immediately after paste. The engine remains deterministic and testable.

## Alternatives Considered

LLM-based input classification was rejected because Phase 2 must stay local, deterministic, and offline-friendly.
