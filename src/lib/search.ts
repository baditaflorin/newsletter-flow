import MiniSearch from 'minisearch'
import type { ResearchSource } from '../types'

export function searchSources(sources: ResearchSource[], query: string) {
  const trimmed = query.trim()
  if (!trimmed) return sources

  const index = new MiniSearch<ResearchSource>({
    fields: ['title', 'summary', 'content', 'tags'],
    idField: 'id',
    searchOptions: {
      boost: { title: 3, tags: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
    storeFields: ['id'],
  })

  index.addAll(sources)
  const ids = new Set(index.search(trimmed).map((result) => result.id))
  return sources.filter((source) => ids.has(source.id))
}
