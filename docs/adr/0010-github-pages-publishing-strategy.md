# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable from the initial scaffold.

## Decision

Publish from `main` branch `/docs`. Vite builds into `docs/` with `emptyOutDir: false` so ADRs and documentation remain in the same folder. The app uses base path `/newsletter-flow/`, hashed assets, and a copied `404.html` fallback for client-side routing.

Live URL: https://baditaflorin.github.io/newsletter-flow/

Repository URL: https://github.com/baditaflorin/newsletter-flow

## Consequences

`docs/` is intentionally committed and must not be gitignored. Old generated assets can be cleaned by `make clean` before rebuilds when necessary.

## Alternatives Considered

Publishing from repository root was rejected because source files and generated files would mix. A `gh-pages` branch was rejected to keep the deployment model simple and visible in `main`.
