# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

This ADR is mandatory for Mode B projects. The chosen deployment mode is Mode A.

## Decision

No static data generation pipeline is used in v1.

## Consequences

`make data` is intentionally a no-op that explains Mode A. No generated artifacts are committed beyond the Pages build itself.

## Alternatives Considered

A scheduled RSS corpus builder was rejected because v1 projects are private and user-specific.
