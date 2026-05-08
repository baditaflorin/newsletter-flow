# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

This ADR is mandatory for Mode B and Mode C projects. The chosen deployment mode is Mode A.

## Decision

Do not create a Go backend in v1. The repository contains no `cmd/`, `internal/`, `pkg/`, runtime API, Dockerfile, or server deployment tree.

## Consequences

Go-specific linting, tests, metrics, and containerization are not applicable. The repository remains smaller and easier to publish on GitHub Pages.

## Alternatives Considered

A Go API was considered for hosted LLM proxying and RSS fetching, but that would introduce secrets, hosting, CORS, and operations work that v1 does not need.
