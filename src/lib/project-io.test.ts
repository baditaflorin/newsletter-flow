import { describe, expect, it } from 'vitest'
import { createDefaultProject } from './demo'
import {
  makeProjectShareUrl,
  makeProjectStateJson,
  parseProjectShareHash,
  parseProjectStateJson,
} from './project-io'
import { PROJECT_SCHEMA_VERSION } from '../types'

describe('project IO', () => {
  it('round-trips project JSON through the canonical state format', () => {
    const project = createDefaultProject()
    project.idea.workingTitle = 'Round-trip state'
    project.draft = 'Draft body'

    const restored = parseProjectStateJson(makeProjectStateJson(project))

    expect(restored?.schemaVersion).toBe(PROJECT_SCHEMA_VERSION)
    expect(restored?.idea.workingTitle).toBe('Round-trip state')
    expect(restored?.draft).toBe('Draft body')
    expect(restored?.sources).toHaveLength(project.sources.length)
  })

  it('round-trips small projects through a share URL hash', () => {
    const project = createDefaultProject()
    project.sources = []
    project.draft = 'Short draft'

    const share = makeProjectShareUrl(project, 'https://example.com/newsletter-flow/')
    const restored = parseProjectShareHash(new URL(share.url).hash)

    expect(share.tooLarge).toBe(false)
    expect(restored?.draft).toBe('Short draft')
    expect(restored?.schemaVersion).toBe(PROJECT_SCHEMA_VERSION)
  })

  it('rejects invalid project JSON without throwing to callers', () => {
    expect(() => parseProjectStateJson('{')).toThrow()
    expect(parseProjectStateJson(JSON.stringify({ nope: true }))).toBeUndefined()
  })
})
