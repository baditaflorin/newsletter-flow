import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import {
  PROJECT_SCHEMA_VERSION,
  type Idea,
  type InferenceResult,
  type InputKind,
  type NewsletterProject,
  type ResearchSource,
  type SourceShape,
} from '../../types'
import { truncate, wordTokens } from '../text'
import { confidence, confidenceFromSource } from './confidence'
import { stableHash, stableSourceId } from './hash'
import { issues } from './issues'
import {
  absoluteUrl,
  normalizeDate,
  normalizeRawInput,
  normalizeTag,
  normalizeWhitespace,
  stripMarkup,
} from './normalize'

type NodeRecord = Record<string, unknown>

const MAX_IMPORT_ITEMS = 20
const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
})
const cache = new Map<string, InferenceResult>()

const projectExportSchema = z.object({
  schemaVersion: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    idea: z.record(z.string(), z.unknown()),
    sources: z.array(z.record(z.string(), z.unknown())),
  }),
})

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function readString(node: NodeRecord | undefined, keys: string[]) {
  if (!node) return ''
  for (const key of keys) {
    const value = node[key]
    if (typeof value === 'string' && value.trim()) return stripMarkup(value)
    if (typeof value === 'number') return String(value)
    if (value && typeof value === 'object') {
      const nested = value as NodeRecord
      if (typeof nested['#text'] === 'string') return stripMarkup(nested['#text'])
      if (typeof nested.href === 'string') return nested.href
    }
  }
  return ''
}

function readLink(node: NodeRecord | undefined) {
  if (!node) return ''
  const links = asArray(node.link as NodeRecord | NodeRecord[] | undefined)
  const alternate = links.find((link) => link.rel === 'alternate') ?? links[0]
  if (alternate && typeof alternate.href === 'string') return absoluteUrl(alternate.href)

  return absoluteUrl(readString(node, ['link', 'guid']))
}

function readDiscussionUrl(node: NodeRecord | undefined) {
  return absoluteUrl(readString(node, ['comments', 'wfw:commentRss']))
}

function classifyInput(input: string): InputKind {
  const lowered = input.slice(0, 2000).toLowerCase()
  if (!input.trim()) return 'empty'
  if (/^https?:\/\/\S+$/i.test(input.trim())) return 'url'
  if (/^\s*\{/.test(input)) return 'project_json'
  if (/<opml[\s>]/i.test(input)) return 'opml'
  if (/<rss[\s>]/i.test(input)) return 'rss'
  if (/<feed[\s>]/i.test(input) && /<entry[\s>]/i.test(input)) return 'atom'
  if (/<!doctype html|<html[\s>]|<article[\s>]|<body[\s>]/i.test(input)) return 'html'
  if (
    /newsletter|substack|convertkit|chatgpt|buffer|grammarly|subject lines|audience segment/.test(
      lowered,
    )
  ) {
    return 'idea_brief'
  }
  return 'plain_text'
}

function shapeForFeed(
  kind: InputKind,
  channel: NodeRecord | undefined,
  items: NodeRecord[],
): SourceShape {
  const title = readString(channel, ['title']).toLowerCase()
  const joinedTitles = items
    .slice(0, 8)
    .map((item) => readString(item, ['title']))
    .join(' ')
    .toLowerCase()

  if (/hacker news|hnrss/.test(title) || /comments/.test(joinedTitles)) return 'aggregator_feed'
  if (kind === 'atom' && /release|v?\d+\.\d+|react/.test(joinedTitles)) return 'release_notes'
  return 'feed'
}

function sourceTags(shape: SourceShape, title: string, content: string) {
  const tags = new Set<string>()
  tags.add(shape === 'feed' ? 'feed' : shape)
  if (shape === 'aggregator_feed') tags.add('aggregator')
  if (shape === 'article_html' || shape === 'article_text') tags.add('article')
  if (/cost|\$|price|paid|subscription/i.test(`${title} ${content}`)) tags.add('cost')
  if (/workflow|process|daily|publish/i.test(`${title} ${content}`)) tags.add('workflow')
  if (/release|v?\d+\.\d+/i.test(title)) tags.add('release-notes')
  if (/code|api|model|github|react/i.test(`${title} ${content}`)) tags.add('technical')
  return Array.from(tags).map(normalizeTag).sort()
}

function relevanceScore(project: NewsletterProject | undefined, source: ResearchSource) {
  const query = [
    project?.idea.workingTitle,
    project?.idea.audience,
    project?.idea.angle,
    project?.idea.promise,
    project?.idea.notes,
  ]
    .filter(Boolean)
    .join(' ')
  const terms = new Set(wordTokens(query))
  if (!terms.size) return 0
  const haystack = new Set(
    wordTokens(`${source.title} ${source.summary} ${source.content} ${source.tags.join(' ')}`),
  )
  return Array.from(terms).filter((term) => haystack.has(term)).length / Math.max(1, terms.size)
}

function shouldSelect(shape: SourceShape, source: ResearchSource, project?: NewsletterProject) {
  if (shape === 'url_only_source' || shape === 'subscription_list' || shape === 'aggregator_feed')
    return false
  if ((source.confidence?.score ?? 0) < 0.55) return false
  if (!project) return (source.confidence?.score ?? 0) >= 0.7
  return relevanceScore(project, source) > 0.03 || (source.confidence?.score ?? 0) >= 0.85
}

function makeSource(
  inputHash: string,
  index: number,
  shape: SourceShape,
  source: Omit<ResearchSource, 'id' | 'selected'>,
  project?: NewsletterProject,
): ResearchSource {
  const initial: ResearchSource = {
    ...source,
    id: stableSourceId(inputHash, index, source.title, source.url),
    tags: Array.from(new Set(source.tags.map(normalizeTag))).sort(),
    selected: false,
  }
  const confidenceSignal = source.confidence ?? confidenceFromSource(initial)
  const withConfidence = { ...initial, confidence: confidenceSignal }
  return {
    ...withConfidence,
    selected: shouldSelect(shape, withConfidence, project),
    reasoning: [
      ...(source.reasoning ?? []),
      `Detected as ${shape.replaceAll('_', ' ')}.`,
      `Confidence is ${confidenceSignal.label} (${confidenceSignal.score}).`,
    ],
  }
}

function sourceFromFeedItem(
  inputHash: string,
  index: number,
  inputKind: InputKind,
  shape: SourceShape,
  item: NodeRecord,
  project?: NewsletterProject,
): ResearchSource {
  const title = readString(item, ['title']) || 'Untitled feed item'
  const url = readLink(item)
  const author = readString(item, ['dc:creator', 'author', 'creator'])
  const publishedAtRaw = readString(item, ['pubDate', 'published', 'updated'])
  const publishedAtIso = normalizeDate(publishedAtRaw)
  const rawContent = readString(item, ['content:encoded', 'content', 'summary', 'description'])
  const content = normalizeWhitespace(rawContent)
  const summary = truncate(readString(item, ['description', 'summary']) || content, 240)
  const discussionUrl = readDiscussionUrl(item)
  const itemIssues = []

  if (shape === 'aggregator_feed' && content.length < 160) itemIssues.push(issues.metadataHeavy())
  if (!content.trim()) itemIssues.push(issues.lowContent())

  return makeSource(
    inputHash,
    index,
    shape,
    {
      kind: 'rss',
      title,
      url,
      author,
      publishedAt: publishedAtIso || publishedAtRaw,
      summary,
      content,
      tags: sourceTags(shape, title, content),
      confidence: confidenceFromSource({ title, url, summary, content }),
      issues: itemIssues,
      provenance: {
        inputKind,
        shape,
        inputHash,
        sourceIndex: index,
        originalUrl: url,
        discussionUrl: discussionUrl || undefined,
        publishedAtIso: publishedAtIso || undefined,
      },
      reasoning: [
        publishedAtIso
          ? 'Date was normalized to ISO format.'
          : 'No confidently parseable date was found.',
        discussionUrl ? 'A discussion URL was preserved separately from the source URL.' : '',
      ].filter(Boolean),
    },
    project,
  )
}

function parseFeed(
  input: string,
  inputHash: string,
  kind: 'rss' | 'atom',
  project?: NewsletterProject,
) {
  const parsed = parser.parse(input) as NodeRecord
  const rss = parsed.rss as NodeRecord | undefined
  const channel = rss?.channel as NodeRecord | undefined
  const feed = parsed.feed as NodeRecord | undefined
  const rssItems = asArray(channel?.item as NodeRecord | NodeRecord[] | undefined)
  const atomItems = asArray(feed?.entry as NodeRecord | NodeRecord[] | undefined)
  const items = kind === 'rss' ? rssItems : atomItems
  const shape = shapeForFeed(kind, kind === 'rss' ? channel : feed, items)
  const imported = items.slice(0, MAX_IMPORT_ITEMS)
  return {
    shape,
    found: items.length,
    sources: imported.map((item, index) =>
      sourceFromFeedItem(inputHash, index, kind, shape, item, project),
    ),
  }
}

function recoverFeedItems(
  input: string,
  inputHash: string,
  kind: 'rss' | 'atom',
  project?: NewsletterProject,
) {
  const itemPattern = kind === 'rss' ? /<item\b[\s\S]*?<\/item>/gi : /<entry\b[\s\S]*?<\/entry>/gi
  const itemBlocks = input.match(itemPattern) ?? []
  const wrapped =
    kind === 'rss'
      ? `<rss><channel>${itemBlocks.join('\n')}</channel></rss>`
      : `<feed>${itemBlocks.join('\n')}</feed>`
  const parsed = parseFeed(wrapped, inputHash, kind, project)
  return { ...parsed, shape: 'truncated_feed' as const }
}

function parseOpml(input: string, inputHash: string) {
  const parsed = parser.parse(input) as NodeRecord
  const outlines: NodeRecord[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return
    const record = node as NodeRecord
    if (typeof record.xmlUrl === 'string') outlines.push(record)
    visit(record.outline)
  }
  visit((parsed.opml as NodeRecord | undefined)?.body)

  return outlines.slice(0, MAX_IMPORT_ITEMS).map((outline, index) => {
    const title = readString(outline, ['title', 'text']) || `Feed ${index + 1}`
    const url = absoluteUrl(readString(outline, ['xmlUrl']))
    return makeSource(inputHash, index, 'subscription_list', {
      kind: 'rss',
      title,
      url,
      author: '',
      publishedAt: '',
      summary: `Feed URL from an OPML subscription list: ${url}`,
      content: '',
      tags: ['subscription-list', 'feed-url'],
      confidence: confidence(0.72, ['OPML outline has a title and xmlUrl.']),
      issues: [issues.opmlUrlsOnly()],
      provenance: {
        inputKind: 'opml',
        shape: 'subscription_list',
        inputHash,
        sourceIndex: index,
        originalUrl: url,
      },
      reasoning: ['Detected OPML outline with xmlUrl.'],
    })
  })
}

function parseHtml(input: string, inputHash: string, project?: NewsletterProject) {
  const title =
    input.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    input.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
    'Pasted article HTML'
  const canonical =
    input.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? ''
  const author =
    input.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? ''
  const article = input.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? input
  const content = stripMarkup(article)
  const normalizedTitle = stripMarkup(title)
  const summary = truncate(content, 240)

  return makeSource(
    inputHash,
    0,
    'article_html',
    {
      kind: 'article',
      title: normalizedTitle,
      url: absoluteUrl(canonical),
      author: stripMarkup(author),
      publishedAt: '',
      summary,
      content,
      tags: sourceTags('article_html', normalizedTitle, content),
      confidence: confidenceFromSource({
        title: normalizedTitle,
        url: canonical,
        summary,
        content,
      }),
      issues: content.length < 160 ? [issues.lowContent()] : [],
      provenance: {
        inputKind: 'html',
        shape: 'article_html',
        inputHash,
        sourceIndex: 0,
        originalUrl: canonical || undefined,
      },
      reasoning: ['Detected article HTML from semantic tags or document structure.'],
    },
    project,
  )
}

function inferIdea(input: string): Partial<Idea> {
  const firstLine = input.split('\n').find(Boolean) ?? ''
  const quoted = firstLine.match(/["“]([^"”]+)["”]/)?.[1]
  const money = Array.from(
    input.matchAll(/\$[0-9][0-9,]*(?:\/yr|\s*per year)?/gi),
    (match) => match[0],
  )
  const stages = input
    .split(/→|->/)
    .map((stage) => normalizeWhitespace(stage))
    .filter(Boolean)

  return {
    workingTitle: quoted || truncate(firstLine.replace(/[#*_`]/g, ''), 80),
    audience: /newsletter writer/i.test(input)
      ? 'newsletter writers replacing a scattered SaaS workflow'
      : 'readers who need a clearer publishing workflow',
    angle: /local llm|local-first|tantivy|pandoc|imagemagick/i.test(input)
      ? 'replace the paid newsletter workflow with a local-first writing desk'
      : 'turn messy notes and sources into a structured newsletter workflow',
    promise: stages.length
      ? `move from ${stages[0].toLowerCase()} to audience-ready exports with less manual setup`
      : 'produce a useful first draft from messy source material',
    notes: normalizeWhitespace(
      `${input}${money.length ? `\n\nDetected cost claims: ${money.join(', ')}.` : ''}`,
    ),
  }
}

function sourceFromPlainText(
  input: string,
  inputHash: string,
  kind: InputKind,
  project?: NewsletterProject,
) {
  const idea = kind === 'idea_brief' ? inferIdea(input) : undefined
  const title = idea?.workingTitle || truncate(input.split('\n').find(Boolean) ?? 'Pasted note', 80)
  const content = normalizeWhitespace(input)
  return {
    idea,
    source: makeSource(
      inputHash,
      0,
      kind === 'idea_brief' ? 'brief' : 'article_text',
      {
        kind: kind === 'idea_brief' ? 'note' : 'article',
        title,
        url: '',
        author: '',
        publishedAt: '',
        summary: truncate(content, 240),
        content,
        tags: sourceTags(kind === 'idea_brief' ? 'brief' : 'article_text', title, content),
        confidence: confidence(kind === 'idea_brief' ? 0.78 : 0.62, [
          kind === 'idea_brief'
            ? 'Newsletter workflow vocabulary and cost signals were found.'
            : 'Plain text has enough body content to become a source.',
        ]),
        issues: [],
        provenance: {
          inputKind: kind,
          shape: kind === 'idea_brief' ? 'brief' : 'article_text',
          inputHash,
          sourceIndex: 0,
        },
        reasoning: [
          kind === 'idea_brief'
            ? 'Detected idea-brief vocabulary.'
            : 'Detected plain article text.',
        ],
      },
      project,
    ),
  }
}

function fromProjectJson(input: string) {
  const parsed = JSON.parse(input) as unknown
  const result = projectExportSchema.safeParse(parsed)
  if (!result.success) return undefined
  return result.data.project as unknown as NewsletterProject
}

function result(
  inputKind: InputKind,
  shape: SourceShape,
  inputHash: string,
  normalizedInput: string,
  startedAt: number,
  sources: ResearchSource[],
  extra: Partial<InferenceResult> = {},
): InferenceResult {
  const found = extra.report?.found ?? sources.length
  const imported = sources.length
  const skipped = Math.max(0, found - imported)
  const issuesList = [...(extra.issues ?? [])].sort((a, b) => a.code.localeCompare(b.code))
  const reasons = extra.reasoning ?? [`Detected input kind ${inputKind}.`]
  return {
    inputKind,
    shape,
    inputHash,
    normalizedInput,
    sources,
    suggestedIdea: extra.suggestedIdea,
    importedProject: extra.importedProject,
    confidence: extra.confidence ?? confidence(sources.length ? 0.72 : 0.35, reasons),
    report: {
      found,
      imported,
      skipped,
      capped: skipped > 0,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      inputBytes: new Blob([normalizedInput]).size,
    },
    issues: issuesList,
    reasoning: reasons,
  }
}

export function analyzeNewsletterInput(
  rawInput: string,
  project?: NewsletterProject,
): InferenceResult {
  const startedAt = performance.now()
  const normalizedInput = normalizeRawInput(rawInput)
  const inputHash = stableHash(normalizedInput)
  const kind = classifyInput(normalizedInput)

  if (kind === 'empty') {
    return result('empty', 'unknown', inputHash, normalizedInput, startedAt, [], {
      issues: [issues.emptyInput()],
      confidence: confidence(0.95, ['Input is empty after normalization.']),
    })
  }

  if (kind === 'url') {
    const url = absoluteUrl(normalizedInput)
    const source = makeSource(
      inputHash,
      0,
      'url_only_source',
      {
        kind: 'article',
        title: url,
        url,
        author: '',
        publishedAt: '',
        summary: 'URL-only source. Add article text before using as evidence.',
        content: '',
        tags: ['url-only', 'needs-text'],
        confidence: confidence(0.42, ['A URL was found, but no article text was provided.']),
        issues: [issues.urlOnly()],
        provenance: {
          inputKind: 'url',
          shape: 'url_only_source',
          inputHash,
          sourceIndex: 0,
          originalUrl: url,
        },
        reasoning: ['Detected a single URL and intentionally left it unselected.'],
      },
      project,
    )
    return result('url', 'url_only_source', inputHash, normalizedInput, startedAt, [source], {
      issues: [issues.urlOnly()],
      confidence: confidence(0.85, ['Single URL pattern matched.']),
    })
  }

  if (kind === 'project_json') {
    const importedProject = fromProjectJson(normalizedInput)
    if (importedProject) {
      return result('project_json', 'project_export', inputHash, normalizedInput, startedAt, [], {
        importedProject: {
          ...importedProject,
          schemaVersion: importedProject.schemaVersion || PROJECT_SCHEMA_VERSION,
        },
        confidence: confidence(0.9, ['Project JSON export schema matched.']),
        reasoning: ['Detected Newsletter Flow project JSON.'],
      })
    }
  }

  if (kind === 'opml') {
    try {
      const sources = parseOpml(normalizedInput, inputHash)
      return result('opml', 'subscription_list', inputHash, normalizedInput, startedAt, sources, {
        issues: [issues.opmlUrlsOnly()],
        confidence: confidence(0.86, ['OPML root and feed outline URLs were found.']),
        reasoning: ['Detected OPML subscription list and extracted feed URLs.'],
      })
    } catch {
      return result('opml', 'subscription_list', inputHash, normalizedInput, startedAt, [], {
        issues: [issues.malformed(), issues.opmlUrlsOnly()],
        confidence: confidence(0.56, ['OPML root was found, but parsing needed recovery.']),
      })
    }
  }

  if (kind === 'rss' || kind === 'atom') {
    try {
      const parsed = parseFeed(normalizedInput, inputHash, kind, project)
      const capped = parsed.found > MAX_IMPORT_ITEMS
      return result(kind, parsed.shape, inputHash, normalizedInput, startedAt, parsed.sources, {
        report: {
          found: parsed.found,
          imported: parsed.sources.length,
          skipped: Math.max(0, parsed.found - parsed.sources.length),
          capped,
          durationMs: 0,
          inputBytes: 0,
        },
        issues: capped ? [issues.importCapped(parsed.found, parsed.sources.length)] : [],
        confidence: confidence(0.88, [`${kind.toUpperCase()} feed root and entries were found.`]),
        reasoning: [`Detected ${kind.toUpperCase()} feed with ${parsed.found} entries.`],
      })
    } catch {
      const recovered = recoverFeedItems(normalizedInput, inputHash, kind, project)
      return result(
        kind,
        'truncated_feed',
        inputHash,
        normalizedInput,
        startedAt,
        recovered.sources,
        {
          report: {
            found: recovered.sources.length,
            imported: recovered.sources.length,
            skipped: 0,
            capped: false,
            durationMs: 0,
            inputBytes: 0,
          },
          issues: [issues.truncated(), issues.malformed()],
          confidence: confidence(recovered.sources.length ? 0.62 : 0.32, [
            'Feed recovery was attempted.',
          ]),
          reasoning: ['Recovered complete feed entries from a malformed or truncated feed.'],
        },
      )
    }
  }

  if (kind === 'html') {
    const source = parseHtml(normalizedInput, inputHash, project)
    return result('html', 'article_html', inputHash, normalizedInput, startedAt, [source], {
      confidence: confidence(0.82, ['HTML document or article tags were found.']),
      reasoning: ['Detected pasted article HTML.'],
    })
  }

  const plain = sourceFromPlainText(normalizedInput, inputHash, kind, project)
  return result(
    kind,
    kind === 'idea_brief' ? 'brief' : 'article_text',
    inputHash,
    normalizedInput,
    startedAt,
    [plain.source],
    {
      suggestedIdea: plain.idea,
      confidence: confidence(kind === 'idea_brief' ? 0.8 : 0.6, [
        kind === 'idea_brief'
          ? 'Newsletter workflow vocabulary was found.'
          : 'Plain text body was found.',
      ]),
      reasoning: [
        kind === 'idea_brief'
          ? 'Detected freeform newsletter idea brief.'
          : 'Detected pasted prose.',
      ],
    },
  )
}

export function analyzeNewsletterInputCached(rawInput: string, project?: NewsletterProject) {
  const normalizedInput = normalizeRawInput(rawInput)
  const key = `${stableHash(normalizedInput)}:${project?.id ?? 'no-project'}:${project?.updatedAt ?? 'no-date'}`
  const cached = cache.get(key)
  if (cached)
    return { ...cached, reasoning: [...cached.reasoning, 'Returned from inference cache.'] }
  const analysis = analyzeNewsletterInput(normalizedInput, project)
  cache.set(key, analysis)
  return analysis
}

export function inputCacheStats() {
  return { entries: cache.size }
}
