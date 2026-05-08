# Postmortem

Repository: https://github.com/baditaflorin/newsletter-flow

Live app: https://baditaflorin.github.io/newsletter-flow/

Release: v0.1.0

## What Was Built

Newsletter Flow v0.1.0 is a static, local-first GitHub Pages PWA for the newsletter writer's daily flow.

Implemented:

- Idea capture with audience, angle, promise, and notes.
- Browser-local project persistence through IndexedDB and Dexie.
- Manual research source capture.
- RSS/Atom XML paste import.
- Local source search through MiniSearch.
- Deterministic Markdown draft generation.
- Optional BYO Ollama-style local LLM drafting and polishing.
- Grammar and readability checks for word count, reading time, long sentences, passive matches, hedges, and repeated words.
- Image brief generation and Unsplash search handoff.
- Audience-segment subject line variants.
- Substack Markdown, X thread, LinkedIn, and project JSON exports.
- GitHub repository link and PayPal support link in the live app.
- Version and commit display on the GitHub Pages app.
- Mandatory ADRs, deploy docs, privacy docs, local hooks, Makefile, unit tests, Playwright smoke test, and project governance files.

## Was Mode A Correct?

Yes. Mode A was the right choice for v1.

The core value is a private writing workspace, not shared server data. Browser storage, static assets, client-side parsing, local search, generated exports, and optional local LLM calls cover the v1 workflow without a runtime backend.

Mode B would only become useful if the project ships a public curated research corpus or pre-built dataset. Mode C would only become justified by cross-device sync, hosted collaboration, private server-side API integrations, or real email/subscriber mutations.

## What Worked

- GitHub Pages from `main` `/docs` worked from the first scaffold.
- The app stayed below the 200KB gzipped initial JS budget at about 137KB.
- The local-first architecture avoided secrets and backend operations.
- MiniSearch, Dexie, Vite, React, and Playwright fit the project well.
- Local hooks caught formatting, type, and smoke-test issues before push.

## What Did Not Work

- Embedding `git rev-parse HEAD` directly in the bundle created a commit/build loop because every post-commit build changed the asset hash.
- The fix was to display the latest public GitHub commit through the unauthenticated GitHub commits endpoint, with a static fallback.
- Prettier initially checked generated `docs/index.html` and `docs/404.html`, which made generated Pages output fight the formatter.
- The fix was to ignore generated Pages files while still formatting hand-written docs.

## What Surprised Us

- The local disk filled during formatting because shared package/cache directories were large. Clearing safe npm and uv caches resolved it.
- Some unrelated local Vite preview processes occupied the default preview port, so the smoke test moved to port `4873`.

## Accepted Tech Debt

- Heavy WASM tools from the concept, such as Tantivy, ImageMagick, Pandoc, and sentence-transformers, are not included in v1.
- The app uses deterministic templates plus optional local LLM calls rather than a full model orchestration layer.
- RSS URL fetching is not implemented because browser CORS would make it unreliable without a backend. RSS XML paste import is included.
- There is no cross-device sync, auth, or subscriber/email sending.
- The UI is a single-page workspace; deeper feature extraction can happen as workflows grow.

## Next Three Improvements

1. Add project import with zod validation and conflict-safe merge behavior.
2. Add optional Transformers.js or WASM embeddings behind an explicit lazy-loaded research action.
3. Add a richer image workflow with local uploads, crop/resize, and exportable social card variants.

## Time Spent Vs Estimate

Estimated: 4 to 6 hours for a solid v0.1 static implementation with docs, tests, hooks, and Pages.

Actual: roughly 4.5 hours of implementation and verification work in this session.

The estimate held because Mode A avoided backend, Docker, nginx, auth, and server observability work.
