import type { ResearchSource } from '../types'
import { analyzeNewsletterInput } from './input/inference'

export function parseRssItems(xml: string): ResearchSource[] {
  const result = analyzeNewsletterInput(xml)
  return result.sources
}
