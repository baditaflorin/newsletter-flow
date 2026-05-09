import Dexie, { type Table } from 'dexie'
import { PROJECT_SCHEMA_VERSION, type NewsletterProject } from '../types'
import { createDefaultProject } from '../lib/demo'
import { makeId, nowIso } from '../lib/ids'

class NewsletterFlowDatabase extends Dexie {
  projects!: Table<NewsletterProject, string>

  constructor() {
    super('newsletter-flow')
    this.version(1).stores({
      projects: 'id, updatedAt',
    })
  }
}

export const db = new NewsletterFlowDatabase()

function ensureProject(project: NewsletterProject): NewsletterProject {
  return {
    ...project,
    schemaVersion: project.schemaVersion || PROJECT_SCHEMA_VERSION,
    activity: project.activity ?? [
      {
        id: makeId('activity'),
        at: nowIso(),
        action: 'project-loaded',
        summary: 'Existing local project loaded and normalized for Phase 2.',
        severity: 'info',
      },
    ],
    sources: project.sources.map((source, index) => ({
      ...source,
      confidence: source.confidence ?? {
        score: source.content || source.summary ? 0.7 : 0.4,
        label: source.content || source.summary ? 'medium' : 'low',
        reasons: ['Existing source normalized after schema upgrade.'],
      },
      issues: source.issues ?? [],
      provenance: source.provenance ?? {
        inputKind:
          source.kind === 'rss' ? 'rss' : source.kind === 'article' ? 'plain_text' : 'idea_brief',
        shape:
          source.kind === 'rss' ? 'feed' : source.kind === 'article' ? 'article_text' : 'brief',
        inputHash: `legacy-${project.id}`,
        sourceIndex: index,
        originalUrl: source.url || undefined,
      },
      reasoning: source.reasoning ?? ['Loaded from an existing local project.'],
    })),
  }
}

export async function loadLatestProject() {
  const latest = await db.projects.orderBy('updatedAt').last()
  if (latest) return ensureProject(latest)

  const fresh = createDefaultProject()
  await db.projects.put(fresh)
  return fresh
}

export async function saveProject(project: NewsletterProject) {
  await db.projects.put(project)
}

export async function resetProject() {
  const fresh = createDefaultProject()
  await db.projects.put(fresh)
  return fresh
}
