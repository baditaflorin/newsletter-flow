export const PROJECT_SCHEMA_VERSION = 'newsletter-flow.project.v2'

export type SourceKind = 'note' | 'article' | 'rss'
export type InputKind =
  | 'idea_brief'
  | 'rss'
  | 'atom'
  | 'opml'
  | 'html'
  | 'url'
  | 'project_json'
  | 'plain_text'
  | 'empty'
  | 'unknown'

export type SourceShape =
  | 'brief'
  | 'feed'
  | 'release_notes'
  | 'aggregator_feed'
  | 'subscription_list'
  | 'article_html'
  | 'url_only_source'
  | 'article_text'
  | 'truncated_feed'
  | 'project_export'
  | 'unknown'

export type IssueSeverity = 'info' | 'warning' | 'recoverable' | 'fatal'

export interface DomainIssue {
  code: string
  severity: IssueSeverity
  what: string
  why: string
  nextStep: string
}

export interface ConfidenceSignal {
  score: number
  label: 'high' | 'medium' | 'low'
  reasons: string[]
}

export interface SourceProvenance {
  inputKind: InputKind
  shape: SourceShape
  inputHash: string
  sourceIndex: number
  originalUrl?: string
  discussionUrl?: string
  publishedAtIso?: string
}

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
  confidence?: ConfidenceSignal
  issues?: DomainIssue[]
  provenance?: SourceProvenance
  reasoning?: string[]
}

export interface ImportReport {
  found: number
  imported: number
  skipped: number
  capped: boolean
  durationMs: number
  inputBytes: number
}

export interface InferenceResult {
  inputKind: InputKind
  shape: SourceShape
  confidence: ConfidenceSignal
  inputHash: string
  normalizedInput: string
  sources: ResearchSource[]
  suggestedIdea?: Partial<Idea>
  importedProject?: NewsletterProject
  report: ImportReport
  issues: DomainIssue[]
  reasoning: string[]
}

export interface ActivityEntry {
  id: string
  at: string
  action: string
  summary: string
  severity: IssueSeverity
  metadata?: Record<string, string | number | boolean>
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
  schemaVersion: string
  name: string
  idea: Idea
  sources: ResearchSource[]
  segments: AudienceSegment[]
  draft: string
  imageBrief: ImageBrief
  llm: LocalLlmSettings
  activity: ActivityEntry[]
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
  metadata: ExportMetadata
}

export interface ExportMetadata {
  appVersion: string
  schemaVersion: string
  generatedAt: string
  sourceIds: string[]
  confidenceSummary: {
    high: number
    medium: number
    low: number
  }
  parameters: {
    selectedSourceCount: number
    totalSourceCount: number
    exportFormats: string[]
  }
}
