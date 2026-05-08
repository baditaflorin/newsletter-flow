import { describe, expect, it } from 'vitest'
import { createDefaultProject } from './demo'
import { searchSources } from './search'

describe('searchSources', () => {
  it('finds research sources by title, content, and tag', () => {
    const project = createDefaultProject()

    expect(searchSources(project.sources, 'IndexedDB')).toHaveLength(1)
    expect(searchSources(project.sources, 'workflow').length).toBeGreaterThan(0)
    expect(searchSources(project.sources, '')).toHaveLength(project.sources.length)
  })
})
