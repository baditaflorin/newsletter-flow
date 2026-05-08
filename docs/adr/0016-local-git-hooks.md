# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions and relies on local checks.

## Decision

Use plain `.githooks/` wired through `git config core.hooksPath .githooks` by `make install-hooks`.

Hooks:

- `pre-commit`: lint, format check, TypeScript check, and gitleaks staged scan.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.
- `post-merge` and `post-checkout`: dependency reminder only.

## Consequences

Checks are local and transparent. Contributors must run `make install-hooks` after cloning.

## Alternatives Considered

Lefthook was considered but plain hooks are sufficient and avoid another tool dependency.
