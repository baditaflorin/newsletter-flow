import Dexie, { type Table } from 'dexie'
import type { NewsletterProject } from '../types'
import { createBlankProject, createDefaultProject } from '../lib/demo'
import { normalizeProject } from '../lib/project-schema'

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

export async function loadLatestProject() {
  const latest = await db.projects.orderBy('updatedAt').last()
  if (latest)
    return normalizeProject(latest, 'Existing local project migrated to Phase 3.') ?? latest

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

export async function createBlankWorkspace() {
  const fresh = createBlankProject()
  await db.projects.put(fresh)
  return fresh
}

export async function clearLocalProjects() {
  await db.projects.clear()
  const fresh = createBlankProject()
  await db.projects.put(fresh)
  return fresh
}
