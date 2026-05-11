import type { ReadabilityScores } from '../types'
import { sentenceSplit, wordTokens } from './text'

/**
 * Estimate the number of syllables in an English word. Uses the standard
 * vowel-group + adjustments approach from the Naval Academy / EDA style
 * counters (Bormuth 1969, popularised by readability-score libraries):
 *  - Lowercase, strip non-letters.
 *  - Each contiguous run of vowels counts as one syllable.
 *  - Drop a silent trailing "e".
 *  - Words shorter than this min get a syllable count of 1.
 */
export function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (word.length <= 3) return 1

  let trimmed = word
  if (trimmed.endsWith('es') || trimmed.endsWith('ed')) {
    // Trailing -es and -ed often share a syllable with the previous vowel;
    // strip them so the vowel-group pass doesn't over-count.
    trimmed = trimmed.slice(0, -2)
  } else if (trimmed.endsWith('e')) {
    trimmed = trimmed.slice(0, -1)
  }

  const groups = trimmed.match(/[aeiouy]+/g)
  const count = groups ? groups.length : 0
  return Math.max(1, count)
}

export function isComplexWord(word: string): boolean {
  // Gunning Fog defines a "complex" word as one with three or more syllables,
  // excluding proper nouns, common compound words, and -es / -ed inflections.
  const lower = word.toLowerCase()
  if (lower.length === 0) return false
  if (/^[A-Z]/.test(word)) return false
  if (lower.endsWith('es') || lower.endsWith('ed') || lower.endsWith('ing')) return false
  return countSyllables(lower) >= 3
}

export function readabilityScores(text: string): ReadabilityScores {
  const words = wordTokens(text)
  const sentences = sentenceSplit(text).filter(Boolean)
  const wordCount = words.length
  const sentenceCount = Math.max(1, sentences.length)
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0)
  const averageSentenceLength = wordCount / sentenceCount
  const averageSyllablesPerWord = wordCount === 0 ? 0 : syllables / wordCount
  const complexCount = words.filter((word) => isComplexWord(word)).length
  const complexWordRatio = wordCount === 0 ? 0 : complexCount / wordCount

  const fleschReadingEase =
    wordCount === 0 ? 100 : 206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord
  const fleschKincaidGrade =
    wordCount === 0 ? 0 : 0.39 * averageSentenceLength + 11.8 * averageSyllablesPerWord - 15.59
  const gunningFog = wordCount === 0 ? 0 : 0.4 * (averageSentenceLength + 100 * complexWordRatio)

  return {
    fleschReadingEase: round(fleschReadingEase),
    fleschKincaidGrade: round(fleschKincaidGrade),
    gunningFog: round(gunningFog),
    averageSentenceLength: round(averageSentenceLength),
    averageSyllablesPerWord: round(averageSyllablesPerWord, 2),
    complexWordRatio: round(complexWordRatio, 3),
    gradeLabel: gradeLabelFor(fleschReadingEase),
  }
}

function round(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Map Flesch Reading Ease back to a readable English label per the Flesch
 * 1948 bucket table. Higher score = easier to read.
 */
function gradeLabelFor(reading: number): string {
  if (reading >= 90) return 'Very easy (5th grade)'
  if (reading >= 80) return 'Easy (6th grade)'
  if (reading >= 70) return 'Fairly easy (7th grade)'
  if (reading >= 60) return 'Plain English (8–9th grade)'
  if (reading >= 50) return 'Fairly difficult (10–12th grade)'
  if (reading >= 30) return 'Difficult (college)'
  return 'Very difficult (college graduate)'
}
