import Dexie, { type Table } from 'dexie'
import type { NewsletterProject } from '../types'
import { createDefaultProject } from '../lib/demo'

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
  if (latest) return latest

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
