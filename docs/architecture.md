# Architecture

Newsletter Flow is a Mode A static GitHub Pages app.

Live app: https://baditaflorin.github.io/newsletter-flow/

Repository: https://github.com/baditaflorin/newsletter-flow

## Context

```mermaid
C4Context
  title Newsletter Flow context
  Person(writer, "Newsletter writer", "Captures ideas, imports sources, drafts, polishes, and exports posts.")
  System_Boundary(browser, "User browser") {
    System(app, "Newsletter Flow PWA", "Static React app served by GitHub Pages.")
    SystemDb(storage, "IndexedDB", "Private local project storage.")
  }
  System_Ext(github, "GitHub Pages", "Hosts static docs/ assets.")
  System_Ext(repo, "GitHub repository", "Source, ADRs, and issue tracker.")
  System_Ext(local_llm, "Optional local LLM", "User-owned Ollama-style endpoint on localhost.")

  Rel(writer, app, "Uses")
  Rel(app, storage, "Persists projects")
  Rel(github, app, "Serves")
  Rel(app, repo, "Links to")
  Rel(app, local_llm, "Optional BYO requests")
```

## Container

```mermaid
flowchart TB
  subgraph "GitHub Pages boundary"
    Static["docs/index.html, assets, 404.html"]
  end

  subgraph "Browser runtime"
    React["React + TypeScript UI"]
    Research["Research ingestion and MiniSearch"]
    Drafting["Draft, polish, subject-line, export logic"]
    Dexie["Dexie IndexedDB adapter"]
    SW["Service worker"]
  end

  Static --> React
  React --> Research
  React --> Drafting
  React --> Dexie
  React --> SW
  Drafting -. optional .-> LocalLLM["http://localhost:11434/api/generate"]
```

## Module Boundaries

- `src/features/` is reserved for future feature extraction.
- `src/lib/` contains pure logic for generation, search, RSS parsing, text utilities, downloads, and local LLM calls.
- `src/db/` owns IndexedDB persistence.
- `src/components/` contains shared shell components.
- `docs/adr/` records architecture decisions before significant changes.

## Pages Boundary

GitHub Pages serves only static files from `main` branch `/docs`.

There is no runtime API, Docker service, nginx proxy, auth provider, server database, Prometheus endpoint, or server-side log sink.
