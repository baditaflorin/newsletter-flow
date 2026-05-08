# 0006 - WASM Modules

## Status

Accepted

## Context

The concept mentions Tantivy, ImageMagick, Pandoc, and sentence-transformers. On GitHub Pages these would require browser-safe WASM, lazy loading, and careful payload control.

## Decision

Do not ship heavy WASM in v1. Use small browser-native or JavaScript libraries for the initial release:

- MiniSearch for local full-text search.
- Browser DOMParser plus fast-xml-parser for RSS XML ingestion.
- Template and heuristic text generation with optional BYO local LLM endpoint.
- Canvas/download APIs for lightweight image and export flows.

Future WASM modules must be lazy-loaded behind user actions and documented in a new ADR before implementation.

## Consequences

The v1 app stays fast and deployable on Pages without COOP/COEP header control. Some parity with desktop CLI tools is deferred.

## Alternatives Considered

Tantivy WASM, ImageMagick WASM, Pandoc WASM, and Transformers.js were considered. They were deferred because they would inflate payload size and complicate GitHub Pages headers.
