import type { ConfidenceSignal, ResearchSource } from '../../types'

export function confidence(score: number, reasons: string[]): ConfidenceSignal {
  const bounded = Math.max(0, Math.min(1, Number(score.toFixed(2))))
  return {
    score: bounded,
    label: bounded >= 0.8 ? 'high' : bounded >= 0.55 ? 'medium' : 'low',
    reasons,
  }
}

export function confidenceFromSource(
  source: Pick<ResearchSource, 'title' | 'url' | 'summary' | 'content'>,
) {
  let score = 0.35
  const reasons: string[] = []

  if (source.title.trim()) {
    score += 0.18
    reasons.push('Has a source title.')
  }
  if (source.url.trim()) {
    score += 0.12
    reasons.push('Has a source URL.')
  }
  if (source.summary.trim().length > 40) {
    score += 0.18
    reasons.push('Has a meaningful summary.')
  }
  if (source.content.trim().length > 160) {
    score += 0.22
    reasons.push('Has enough body text to support a draft.')
  }
  if (!source.content.trim() && source.url.trim()) {
    score -= 0.2
    reasons.push('URL-only sources need pasted article text before use as evidence.')
  }

  return confidence(
    score,
    reasons.length ? reasons : ['Only minimal source information was found.'],
  )
}
