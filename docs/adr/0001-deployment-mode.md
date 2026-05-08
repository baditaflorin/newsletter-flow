# 0001 - Deployment Mode

## Status

Accepted

## Context

The product is a local-first newsletter writing desk. The default architectural rule is GitHub Pages first, with runtime servers only when static delivery is genuinely insufficient.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static React PWA served from `main` branch `/docs` at https://baditaflorin.github.io/newsletter-flow/. Drafts, sources, audience segments, local LLM settings, and exports live in the browser through IndexedDB and localStorage. Any LLM support is bring-your-own local endpoint, such as Ollama running on the user's machine.

## Consequences

There is no runtime backend, no Docker image, no nginx deployment, no server auth, and no server-side secrets. Backend, Docker, nginx, runtime metrics, and server deployment requirements are not applicable to v1.

The frontend must handle failures gracefully when browser-only capabilities are limited, such as RSS feeds blocked by CORS or local LLM endpoints that are not running.

## Alternatives Considered

Mode B was considered for pre-built RSS/search artifacts, but v1 needs user-owned writing projects rather than shared public datasets.

Mode C was rejected because v1 does not require account auth, shared mutations, server-side secrets, or cross-device sync.
