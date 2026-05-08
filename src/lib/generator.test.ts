import { describe, expect, it } from 'vitest'
import {
  analyzeDraft,
  composeDraft,
  generateSubjectLines,
  makePlatformExports,
  polishDraft,
} from './generator'
import { createDefaultProject } from './demo'

describe('newsletter generation', () => {
  it('composes a markdown draft from the local project', () => {
    const project = createDefaultProject()
    const draft = composeDraft(project)

    expect(draft).toContain('# The Local-First Newsletter Workflow')
    expect(draft).toContain('daily newsletter workflow')
  })

  it('analyzes and polishes draft text', () => {
    const analysis = analyzeDraft('This is very useful. It is probably being adopted slowly.')
    const polished = polishDraft('This is very useful because it is really practical.')

    expect(analysis.wordCount).toBeGreaterThan(5)
    expect(analysis.hedgeMatches).toContain('very')
    expect(polished.text).not.toContain('very useful')
    expect(polished.notes.length).toBeGreaterThan(0)
  })

  it('creates segment subject lines and exports', () => {
    const project = createDefaultProject()
    project.draft = composeDraft(project)

    expect(generateSubjectLines(project)).toHaveLength(project.segments.length)
    expect(makePlatformExports(project).xThread[0]).toMatch(/^1\//)
    expect(makePlatformExports(project).linkedIn).toContain('Takeaway:')
  })
})
