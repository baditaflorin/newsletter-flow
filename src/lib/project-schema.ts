import { z } from 'zod'
import {
  PROJECT_SCHEMA_VERSION,
  type ActivityEntry,
  type AudienceSegment,
  type DomainIssue,
  type Idea,
  type ImageBrief,
  type LocalLlmSettings,
  type NewsletterProject,
  type ResearchSource,
} from '../types'
import { makeId, nowIso } from './ids'
import { sourceHasEvidence } from './sources'

const stringArraySchema = z.array(z.string()).catch([])

const issueSchema = z
  .object({
    code: z.string(),
    severity: z.enum(['info', 'warning', 'recoverable', 'fatal']),
    what: z.string(),
    why: z.string(),
    nextStep: z.string(),
  })
  .passthrough()

const confidenceSchema = z
  .object({
    score: z.number().min(0).max(1),
    label: z.enum(['high', 'medium', 'low']),
    reasons: z.array(z.string()),
  })
  .passthrough()

const provenanceSchema = z
  .object({
    inputKind: z.enum([
      'idea_brief',
      'rss',
      'atom',
      'opml',
      'html',
      'url',
      'project_json',
      'plain_text',
      'empty',
      'unknown',
    ]),
    shape: z.enum([
      'brief',
      'feed',
      'release_notes',
      'aggregator_feed',
      'subscription_list',
      'article_html',
      'url_only_source',
      'article_text',
      'truncated_feed',
      'project_export',
      'unknown',
    ]),
    inputHash: z.string(),
    sourceIndex: z.number(),
    originalUrl: z.string().optional(),
    discussionUrl: z.string().optional(),
    publishedAtIso: z.string().optional(),
  })
  .passthrough()

const sourceSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(['note', 'article', 'rss']).catch('note'),
    title: z.string().catch(''),
    url: z.string().catch(''),
    author: z.string().catch(''),
    publishedAt: z.string().catch(''),
    summary: z.string().catch(''),
    content: z.string().catch(''),
    tags: stringArraySchema,
    selected: z.boolean().catch(false),
    confidence: confidenceSchema.optional(),
    issues: z.array(issueSchema).catch([]),
    provenance: provenanceSchema.optional(),
    reasoning: z.array(z.string()).catch([]),
  })
  .passthrough()

const projectSchema = z
  .object({
    id: z.string().optional(),
    schemaVersion: z.string().optional(),
    name: z.string().catch('Untitled newsletter project'),
    idea: z
      .object({
        workingTitle: z.string().catch(''),
        audience: z.string().catch(''),
        angle: z.string().catch(''),
        promise: z.string().catch(''),
        notes: z.string().catch(''),
      })
      .catch({ workingTitle: '', audience: '', angle: '', promise: '', notes: '' }),
    sources: z.array(sourceSchema).catch([]),
    segments: z
      .array(
        z
          .object({
            id: z.string().optional(),
            name: z.string().catch('General reader'),
            painPoint: z.string().catch('needs a clearer reason to care'),
            desiredOutcome: z.string().catch('gets a useful takeaway'),
          })
          .passthrough(),
      )
      .catch([]),
    draft: z.string().catch(''),
    imageBrief: z
      .object({
        keywords: z.string().catch('newsletter writing desk'),
        mood: z.string().catch('clear editorial workspace'),
        prompt: z.string().catch('Editorial image for a newsletter draft.'),
        selectedUrl: z.string().catch(''),
        altText: z.string().catch('Newsletter image.'),
      })
      .catch({
        keywords: 'newsletter writing desk',
        mood: 'clear editorial workspace',
        prompt: 'Editorial image for a newsletter draft.',
        selectedUrl: '',
        altText: 'Newsletter image.',
      }),
    llm: z
      .object({
        endpoint: z.string().catch('http://localhost:11434'),
        model: z.string().catch('llama3.2'),
        enabled: z.boolean().catch(false),
      })
      .catch({ endpoint: 'http://localhost:11434', model: 'llama3.2', enabled: false }),
    activity: z
      .array(
        z
          .object({
            id: z.string().optional(),
            at: z.string().optional(),
            action: z.string().catch('project-normalized'),
            summary: z.string().catch('Project normalized.'),
            severity: z.enum(['info', 'warning', 'recoverable', 'fatal']).catch('info'),
            metadata: z
              .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
              .optional(),
          })
          .passthrough(),
      )
      .catch([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough()

const projectEnvelopeSchema = z
  .object({
    schemaVersion: z.string().optional(),
    project: z.unknown(),
  })
  .passthrough()

function isProjectLike(input: unknown) {
  if (!input || typeof input !== 'object') return false
  const record = input as Record<string, unknown>
  return ['idea', 'sources', 'segments', 'draft', 'imageBrief', 'llm'].some((key) => key in record)
}

function normalizeIdea(idea: Idea): Idea {
  return {
    workingTitle: idea.workingTitle,
    audience: idea.audience,
    angle: idea.angle,
    promise: idea.promise,
    notes: idea.notes,
  }
}

function normalizeSource(source: z.infer<typeof sourceSchema>, index: number, projectId: string) {
  const issues = source.issues as DomainIssue[]
  const normalized: ResearchSource = {
    id: source.id || makeId('source'),
    kind: source.kind,
    title: source.title,
    url: source.url,
    author: source.author,
    publishedAt: source.publishedAt,
    summary: source.summary,
    content: source.content,
    tags: Array.from(new Set(source.tags.map((tag) => tag.trim()).filter(Boolean))).sort(),
    selected: Boolean(source.selected && sourceHasEvidence(source as ResearchSource)),
    confidence:
      source.confidence ??
      (sourceHasEvidence(source as ResearchSource)
        ? { score: 0.7, label: 'medium', reasons: ['Imported project source has evidence.'] }
        : { score: 0.4, label: 'low', reasons: ['Imported project source needs review.'] }),
    issues,
    provenance:
      source.provenance ??
      ({
        inputKind: source.kind === 'rss' ? 'rss' : 'plain_text',
        shape:
          source.kind === 'rss' ? 'feed' : source.kind === 'article' ? 'article_text' : 'brief',
        inputHash: `project-${projectId}`,
        sourceIndex: index,
        originalUrl: source.url || undefined,
      } as ResearchSource['provenance']),
    reasoning: source.reasoning.length ? source.reasoning : ['Loaded from project state.'],
  }
  return normalized
}

function normalizeSegment(segment: z.infer<typeof projectSchema>['segments'][number]) {
  return {
    id: segment.id || makeId('segment'),
    name: segment.name,
    painPoint: segment.painPoint,
    desiredOutcome: segment.desiredOutcome,
  } satisfies AudienceSegment
}

function normalizeActivity(entry: z.infer<typeof projectSchema>['activity'][number]) {
  return {
    id: entry.id || makeId('activity'),
    at: entry.at || nowIso(),
    action: entry.action,
    summary: entry.summary,
    severity: entry.severity,
    metadata: entry.metadata,
  } satisfies ActivityEntry
}

function normalizeImageBrief(imageBrief: ImageBrief): ImageBrief {
  return {
    keywords: imageBrief.keywords,
    mood: imageBrief.mood,
    prompt: imageBrief.prompt,
    selectedUrl: imageBrief.selectedUrl,
    altText: imageBrief.altText,
  }
}

function normalizeLlm(llm: LocalLlmSettings): LocalLlmSettings {
  return {
    endpoint: llm.endpoint,
    model: llm.model,
    enabled: llm.enabled,
  }
}

export function normalizeProject(input: unknown, summary = 'Project state normalized.') {
  if (!isProjectLike(input)) return undefined
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) return undefined
  const now = nowIso()
  const projectId = parsed.data.id || makeId('project')
  const activity = parsed.data.activity.map(normalizeActivity)
  if (parsed.data.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    activity.unshift({
      id: makeId('activity'),
      at: now,
      action: 'project-migrated',
      summary,
      severity: 'info',
      metadata: undefined,
    })
  }

  return {
    id: projectId,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: parsed.data.name || parsed.data.idea.workingTitle || 'Untitled newsletter project',
    idea: normalizeIdea(parsed.data.idea),
    sources: parsed.data.sources.map((source, index) => normalizeSource(source, index, projectId)),
    segments: parsed.data.segments.map(normalizeSegment),
    draft: parsed.data.draft,
    imageBrief: normalizeImageBrief(parsed.data.imageBrief),
    llm: normalizeLlm(parsed.data.llm),
    activity,
    createdAt: parsed.data.createdAt || now,
    updatedAt: parsed.data.updatedAt || now,
  } satisfies NewsletterProject
}

export function parseProjectPayload(payload: string) {
  const parsed = JSON.parse(payload) as unknown
  const envelope = projectEnvelopeSchema.safeParse(parsed)
  const candidate = envelope.success && envelope.data.project ? envelope.data.project : parsed
  return normalizeProject(candidate, 'Imported project migrated to the current schema.')
}

export function projectToJson(project: NewsletterProject, metadata: unknown) {
  return JSON.stringify(
    {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      exportedAt: nowIso(),
      metadata,
      project: normalizeProject(project) ?? project,
    },
    null,
    2,
  )
}
