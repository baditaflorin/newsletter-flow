# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Newsletter research inputs arrive as clean feeds, partial feeds, OPML files, article HTML, plain text, URL-only snippets, and malformed fragments.

## Decision

Normalize every input at the boundary:

- Remove UTF-8 BOM.
- Normalize CRLF/CR to LF.
- Replace NBSP with regular spaces.
- Decode common HTML entities.
- Preserve code-block text but mark code-heavy content.
- Collapse excessive prose whitespace.
- Normalize tags to lowercase kebab-case.
- Normalize dates to ISO when confidently parseable.
- Preserve original input hash for reproducibility.

Malformed XML is recoverable when complete RSS/Atom item blocks can be extracted. URL-only input never becomes selected evidence unless content exists.

## Consequences

The parser is more forgiving without pretending broken input is fully clean. Warnings carry the recovery path.

## Alternatives Considered

Strict XML-only parsing was rejected because real users paste partial and wrong-box inputs.
