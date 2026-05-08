# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deploys only static assets.

## Decision

Use GitHub Pages only:

- Source branch: `main`
- Source path: `/docs`
- Live URL: https://baditaflorin.github.io/newsletter-flow/

No `deploy/` directory is needed. Deployment instructions live in `docs/deploy.md`.

## Consequences

Rollback is a git revert of the publishing commit. There is no Docker host, nginx, Prometheus, or runtime process.

## Alternatives Considered

Docker Compose and nginx were rejected because there is no backend.
