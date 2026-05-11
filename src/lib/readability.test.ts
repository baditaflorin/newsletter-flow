import { describe, expect, it } from 'vitest'
import { analyzeDraft } from './generator'
import { countSyllables, isComplexWord, readabilityScores } from './readability'

describe('readability', () => {
  it('counts syllables for representative words', () => {
    expect(countSyllables('cat')).toBe(1)
    expect(countSyllables('newsletter')).toBe(3)
    expect(countSyllables('readability')).toBeGreaterThanOrEqual(5)
    expect(countSyllables('rhythm')).toBe(1)
    expect(countSyllables('idea')).toBeGreaterThanOrEqual(2)
  })

  it('flags multi-syllable words as Gunning-Fog complex', () => {
    expect(isComplexWord('newsletter')).toBe(true)
    expect(isComplexWord('readability')).toBe(true)
    expect(isComplexWord('practice')).toBe(false)
    // Inflected forms are excluded by definition even if syllable-heavy.
    expect(isComplexWord('processed')).toBe(false)
  })

  it('rates a plain-English sentence in the Flesch sweet spot', () => {
    const scores = readabilityScores(
      'Write one short idea each day. Keep the words plain. Read it aloud.',
    )
    expect(scores.fleschReadingEase).toBeGreaterThan(70)
    expect(scores.fleschKincaidGrade).toBeLessThan(7)
    expect(scores.gradeLabel).toMatch(/easy|plain|7th|6th|5th/i)
  })

  it('rates a dense academic sentence as difficult', () => {
    const dense =
      'The marginal utility of incremental simplification asymptotically approaches diminishing returns when developers prematurely abstract their architectural decisions.'
    const scores = readabilityScores(dense)
    expect(scores.fleschReadingEase).toBeLessThan(30)
    expect(scores.fleschKincaidGrade).toBeGreaterThan(12)
    expect(scores.gradeLabel.toLowerCase()).toMatch(/difficult|college/)
  })

  it('exposes readability through analyzeDraft', () => {
    const result = analyzeDraft(
      'Daily writing keeps the desk warm. Ship the smallest complete idea each day.',
    )
    expect(result.readability.fleschReadingEase).toBeGreaterThan(0)
    expect(result.readability.gradeLabel).toBeTruthy()
    expect(result.readability.complexWordRatio).toBeGreaterThanOrEqual(0)
    expect(result.readability.complexWordRatio).toBeLessThanOrEqual(1)
  })

  it('returns sane defaults for an empty input', () => {
    const scores = readabilityScores('')
    expect(scores.averageSentenceLength).toBe(0)
    expect(scores.fleschReadingEase).toBe(100)
    expect(scores.gradeLabel).toMatch(/very easy/i)
  })
})
