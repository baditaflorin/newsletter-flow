# Contributing

Thanks for helping improve Newsletter Flow.

Project URL: https://github.com/baditaflorin/newsletter-flow

Live app: https://baditaflorin.github.io/newsletter-flow/

## Local Setup

```bash
npm install
make install-hooks
make dev
```

## Checks

Run these before pushing:

```bash
make lint
make test
make smoke
```

There are no GitHub Actions. Local hooks are the quality gate.

## Commit Style

Use Conventional Commits:

```text
feat: add import flow
fix: handle empty RSS feeds
docs: update deployment notes
```

Allowed types are `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ops`, and `data`.

## Architecture Decisions

Write or update an ADR before changing deployment mode, persistence strategy, build output, analytics, or major dependencies.

ADR directory: https://github.com/baditaflorin/newsletter-flow/tree/main/docs/adr
