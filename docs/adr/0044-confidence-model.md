# 0044 - Confidence Model

## Status

Accepted

## Context

V1 treated all imported sources and generated outputs as equally trustworthy.

## Decision

Use a 0-1 confidence score on input type, shape, every normalized source, and generated exports.

Bands:

- High: `>= 0.8`
- Medium: `>= 0.55`
- Low: `< 0.55`

Confidence is lowered by missing title, missing content, metadata-only summaries, URL-only content, parse recovery, truncation, and unknown dates. Confidence is raised by clear semantic fields, canonical URLs, meaningful summaries, and shape-specific signals.

Warnings and reasoning strings explain confidence changes. Low-confidence sources are not selected by default.

## Consequences

The app avoids silent wrongness and exports carry confidence metadata.

## Alternatives Considered

Binary valid/invalid flags were rejected because many real inputs are usable but need review.
