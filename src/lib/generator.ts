import type {
  DraftAnalysis,
  ExportMetadata,
  NewsletterProject,
  PlatformExports,
  PolishResult,
  ResearchSource,
  SubjectLine,
} from '../types'
import { PROJECT_SCHEMA_VERSION } from '../types'
import { projectToJson } from './project-schema'
import { readabilityScores } from './readability'
import { sentenceSplit, truncate, wordTokens } from './text'

const hedges = ['maybe', 'probably', 'basically', 'actually', 'just', 'very', 'really', 'somewhat']
const weakAdverbs = /\b\w+ly\b/gi
const passivePattern = /\b(am|is|are|was|were|be|being|been)\s+\w+ed\b/gi

function selectedSources(project: NewsletterProject) {
  const selected = project.sources.filter((source) => source.selected)
  return selected.length ? selected : project.sources.slice(0, 5)
}

function confidenceSummary(project: NewsletterProject): ExportMetadata['confidenceSummary'] {
  return project.sources.reduce(
    (summary, source) => {
      const label = source.confidence?.label ?? 'low'
      summary[label] += 1
      return summary
    },
    { high: 0, medium: 0, low: 0 },
  )
}

export function makeExportMetadata(
  project: NewsletterProject,
  generatedAt = new Date().toISOString(),
): ExportMetadata {
  const selected = project.sources.filter((source) => source.selected)
  const appVersion = typeof __APP_VERSION__ === 'undefined' ? 'test' : __APP_VERSION__
  return {
    appVersion,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    generatedAt,
    sourceIds: selected.map((source) => source.id).sort(),
    confidenceSummary: confidenceSummary(project),
    parameters: {
      selectedSourceCount: selected.length,
      totalSourceCount: project.sources.length,
      exportFormats: ['substack', 'x-thread', 'linkedin', 'project-json'],
    },
  }
}

function sourceBullets(sources: ResearchSource[]) {
  if (!sources.length) return '- No saved sources yet. Add notes or RSS items before publishing.'

  return sources
    .slice(0, 6)
    .map((source) => `- ${source.title}: ${source.summary || truncate(source.content, 160)}`)
    .join('\n')
}

function citationLinks(sources: ResearchSource[]) {
  const linked = sources.filter((source) => source.url)
  if (!linked.length) return ''

  return `\n\n### Sources\n${linked
    .map((source, index) => `${index + 1}. ${source.title} - ${source.url}`)
    .join('\n')}`
}

export function composeDraft(project: NewsletterProject) {
  const sources = selectedSources(project)
  const title = project.idea.workingTitle || project.name
  const audience = project.idea.audience || 'newsletter readers'
  const angle = project.idea.angle || 'make the daily writing flow simpler'
  const promise = project.idea.promise || 'turn one idea into a publishable draft'

  return `# ${title}

The daily newsletter workflow should feel like a desk, not a subscription bundle.

For ${audience}, the current pattern is familiar: capture the idea in one place, research in another, polish somewhere else, then rebuild the same thought for Substack, X, and LinkedIn.

The sharper move is to ${angle}. The promise is simple: ${promise}.

## The cost hiding in the workflow

${project.idea.notes || 'The recurring bill is obvious. The hidden cost is attention spent moving a half-formed argument between tools.'}

## What the research points to

${sourceBullets(sources)}

## The local-first operating rhythm

1. Capture the raw idea before it gets prettified.
2. Pull sources into the same workspace and mark the few that actually support the argument.
3. Draft from the selected evidence, not from a blank page.
4. Polish for clarity, reading rhythm, and over-softened claims.
5. Export once, then adapt the same idea for each platform.

## Why this matters

A newsletter habit compounds when the writer can keep momentum. Local-first tools do not magically make the thinking easy, but they remove the tax around the thinking.

## Try this today

Pick one idea, add three sources, write the strongest version for one reader segment, and publish the smallest complete version. Then improve tomorrow's system instead of buying another tab.${citationLinks(sources)}
`
}

export function analyzeDraft(text: string): DraftAnalysis {
  const words = wordTokens(text)
  const sentences = sentenceSplit(text)
  const counts = new Map<string, number>()

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }

  return {
    wordCount: words.length,
    readingMinutes: Math.max(1, Math.ceil(words.length / 220)),
    longSentences: sentences.filter((sentence) => wordTokens(sentence).length > 28).slice(0, 5),
    passiveMatches: Array.from(text.matchAll(passivePattern), (match) => match[0]).slice(0, 8),
    hedgeMatches: words.filter((word) => hedges.includes(word)).slice(0, 12),
    repeatedWords: Array.from(counts.entries())
      .filter(([, count]) => count > 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word),
    readability: readabilityScores(text),
  }
}

export function polishDraft(text: string): PolishResult {
  let next = text
  const notes: string[] = []
  const replacements: Array<[RegExp, string, string]> = [
    [/\bvery\s+/gi, '', 'Removed "very" where it softened the sentence.'],
    [/\breally\s+/gi, '', 'Removed "really" where it added emphasis without meaning.'],
    [/\bjust\s+/gi, '', 'Removed "just" where it made the claim sound smaller.'],
    [/\bin order to\b/gi, 'to', 'Shortened "in order to" to "to".'],
    [/\bdue to the fact that\b/gi, 'because', 'Shortened "due to the fact that" to "because".'],
  ]

  for (const [pattern, replacement, note] of replacements) {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement)
      notes.push(note)
    }
  }

  if (weakAdverbs.test(text)) {
    notes.push('Flagged adverbs ending in -ly for a human pass.')
  }

  if (notes.length === 0) {
    notes.push('No obvious mechanical polish issues found.')
  }

  return { text: next, notes }
}

export function generateImageBrief(project: NewsletterProject) {
  const keywords = [
    project.idea.workingTitle,
    project.idea.audience,
    ...project.sources.flatMap((source) => source.tags),
  ]
    .join(' ')
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.slice(0, 10)
    .join(' ')

  return {
    keywords: keywords || project.imageBrief.keywords,
    mood: project.imageBrief.mood || 'editorial, clear, useful, warm',
    prompt: `Realistic editorial image for "${project.idea.workingTitle}". Show the idea of ${project.idea.angle}. Mood: ${
      project.imageBrief.mood || 'clean, focused, warm daylight'
    }. Avoid fake text, logos, and clutter.`,
    altText: `Editorial image representing ${project.idea.workingTitle || project.name}.`,
  }
}

export function generateSubjectLines(project: NewsletterProject): SubjectLine[] {
  const title = project.idea.workingTitle || project.name
  const promise = project.idea.promise || 'ship better work with less tool sprawl'

  return project.segments.map((segment) => ({
    segment: segment.name,
    lines: [
      `${segment.name}: ${truncate(promise, 68)}`,
      `A calmer way to ${truncate(segment.desiredOutcome.toLowerCase(), 54)}`,
      `Stop losing time to ${truncate(segment.painPoint.toLowerCase(), 56)}`,
      `${truncate(title, 52)} for ${segment.name.toLowerCase()}s`,
      `The practical workflow for ${truncate(segment.desiredOutcome.toLowerCase(), 58)}`,
    ],
  }))
}

export function makeXThread(markdown: string) {
  const plain = markdown
    .replace(/^#+\s/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{2,}/g, '\n')
  const sentences = sentenceSplit(plain)
  const tweets: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence
    if (candidate.length <= 250) {
      current = candidate
    } else {
      if (current) tweets.push(current)
      current = sentence.length > 250 ? truncate(sentence, 250) : sentence
    }
  }

  if (current) tweets.push(current)
  return tweets.slice(0, 12).map((tweet, index, all) => `${index + 1}/${all.length} ${tweet}`)
}

export function makeLinkedInPost(project: NewsletterProject, draft: string) {
  const sentences = sentenceSplit(draft.replace(/^#+\s/gm, ''))
  const hook = sentences[0] || project.idea.promise || project.idea.workingTitle
  const body = sentences.slice(1, 5).join('\n\n')

  return `${hook}

${body}

Takeaway: ${project.idea.promise || 'keep the workflow close to the work.'}

What part of your publishing workflow still feels heavier than it should?`
}

export function makePlatformExports(project: NewsletterProject): PlatformExports {
  const draft = project.draft || composeDraft(project)
  const metadata = makeExportMetadata(project)
  const provenanceComment = `<!-- newsletter-flow ${JSON.stringify(metadata)} -->`
  return {
    substack: `${provenanceComment}\n\n${draft}`,
    xThread: makeXThread(draft),
    linkedIn: makeLinkedInPost(project, draft),
    projectJson: projectToJson(project, metadata),
    metadata,
  }
}
