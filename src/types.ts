export const PROJECT_SCHEMA_VERSION = 'newsletter-flow.project.v1'

export type SourceKind = 'note' | 'article' | 'rss'

export interface Idea {
  workingTitle: string
  audience: string
  angle: string
  promise: string
  notes: string
}

export interface ResearchSource {
  id: string
  kind: SourceKind
  title: string
  url: string
  author: string
  publishedAt: string
  summary: string
  content: string
  tags: string[]
  selected: boolean
}

export interface AudienceSegment {
  id: string
  name: string
  painPoint: string
  desiredOutcome: string
}

export interface ImageBrief {
  keywords: string
  mood: string
  prompt: string
  selectedUrl: string
  altText: string
}

export interface LocalLlmSettings {
  endpoint: string
  model: string
  enabled: boolean
}

export interface NewsletterProject {
  id: string
  schemaVersion: typeof PROJECT_SCHEMA_VERSION
  name: string
  idea: Idea
  sources: ResearchSource[]
  segments: AudienceSegment[]
  draft: string
  imageBrief: ImageBrief
  llm: LocalLlmSettings
  createdAt: string
  updatedAt: string
}

export interface DraftAnalysis {
  wordCount: number
  readingMinutes: number
  longSentences: string[]
  passiveMatches: string[]
  hedgeMatches: string[]
  repeatedWords: string[]
}

export interface PolishResult {
  text: string
  notes: string[]
}

export interface SubjectLine {
  segment: string
  lines: string[]
}

export interface PlatformExports {
  substack: string
  xThread: string[]
  linkedIn: string
  projectJson: string
}
