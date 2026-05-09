import type { ResearchSource, SourceKind } from '../types'

export const sourceKindOptions = ['note', 'article', 'rss'] as const satisfies SourceKind[]

export function sourceHasEvidence(source: Pick<ResearchSource, 'title' | 'content' | 'summary'>) {
  return Boolean(source.title.trim() && (source.content.trim() || source.summary.trim()))
}

export function parseSourceKind(value: string): SourceKind {
  return sourceKindOptions.includes(value as SourceKind) ? (value as SourceKind) : 'note'
}

export function sourceNeedsReview(source: ResearchSource) {
  return !sourceHasEvidence(source) || (source.confidence?.score ?? 0) < 0.55
}
