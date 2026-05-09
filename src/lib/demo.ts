import { PROJECT_SCHEMA_VERSION, type NewsletterProject } from '../types'
import { makeId, nowIso } from './ids'

function baseProject(name: string, createdAt = nowIso()): NewsletterProject {
  return {
    id: makeId('project'),
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name,
    idea: {
      workingTitle: '',
      audience: '',
      angle: '',
      promise: '',
      notes: '',
    },
    sources: [],
    segments: [
      {
        id: makeId('segment'),
        name: 'General reader',
        painPoint: 'needs a clear reason to open',
        desiredOutcome: 'gets one useful takeaway quickly',
      },
    ],
    draft: '',
    imageBrief: {
      keywords: 'newsletter writing desk',
      mood: 'clear editorial workspace',
      prompt: 'Editorial image for a newsletter draft.',
      selectedUrl: '',
      altText: 'Newsletter image.',
    },
    llm: {
      endpoint: 'http://localhost:11434',
      model: 'llama3.2',
      enabled: false,
    },
    activity: [],
    createdAt,
    updatedAt: createdAt,
  }
}

export function createBlankProject(): NewsletterProject {
  const createdAt = nowIso()
  return {
    ...baseProject('Untitled newsletter project', createdAt),
    activity: [
      {
        id: makeId('activity'),
        at: createdAt,
        action: 'blank-project-created',
        summary: 'Blank local newsletter workspace created.',
        severity: 'info',
      },
    ],
  }
}

export function createDefaultProject(): NewsletterProject {
  const createdAt = nowIso()

  return {
    ...baseProject('Friday dispatch', createdAt),
    name: 'Friday dispatch',
    idea: {
      workingTitle: 'The Local-First Newsletter Workflow',
      audience: 'independent writers and operators tired of tool sprawl',
      angle: 'replace the paid daily writing stack with a private browser workspace',
      promise: 'ship a researched newsletter and platform-ready posts from one idea',
      notes:
        'Costly stack: Substack free, Grammarly, Buffer, Unsplash+, ConvertKit metrics, ChatGPT. Local-first alternative: capture, research, draft, polish, image plan, and export.',
    },
    sources: [
      {
        id: makeId('source'),
        kind: 'note',
        title: 'SaaS stack cost baseline',
        url: '',
        author: '',
        publishedAt: '',
        summary:
          'The paid daily flow can creep past $624/year before counting switching costs or privacy tradeoffs.',
        content:
          'Substack free, Grammarly $144, Buffer $180, Unsplash+ $60, ConvertKit metrics, ChatGPT $240. The real cost is context switching across tools.',
        tags: ['cost', 'workflow'],
        selected: true,
        confidence: {
          score: 0.9,
          label: 'high',
          reasons: ['Curated demo note with title, summary, and content.'],
        },
        issues: [],
        provenance: {
          inputKind: 'plain_text',
          shape: 'brief',
          inputHash: 'demo-cost-baseline',
          sourceIndex: 0,
        },
        reasoning: ['Seeded source for the default workspace.'],
      },
      {
        id: makeId('source'),
        kind: 'note',
        title: 'Local-first replacement map',
        url: '',
        author: '',
        publishedAt: '',
        summary:
          'A browser PWA can cover capture, search, drafting, polish, image planning, and exports while keeping the writer in control.',
        content:
          'IndexedDB stores projects. MiniSearch provides local research search. Optional local LLM calls keep AI use private. Markdown and social posts are generated client-side.',
        tags: ['local-first', 'privacy'],
        selected: true,
        confidence: {
          score: 0.9,
          label: 'high',
          reasons: ['Curated demo note with title, summary, and content.'],
        },
        issues: [],
        provenance: {
          inputKind: 'plain_text',
          shape: 'brief',
          inputHash: 'demo-local-first',
          sourceIndex: 1,
        },
        reasoning: ['Seeded source for the default workspace.'],
      },
    ],
    segments: [
      {
        id: makeId('segment'),
        name: 'Solo creator',
        painPoint: 'too many tabs before publishing',
        desiredOutcome: 'one repeatable daily writing flow',
      },
      {
        id: makeId('segment'),
        name: 'Operator',
        painPoint: 'needs concise repurposing without another SaaS bill',
        desiredOutcome: 'platform-ready copy from one draft',
      },
      {
        id: makeId('segment'),
        name: 'Privacy-minded writer',
        painPoint: 'does not want drafts and sources scattered across vendors',
        desiredOutcome: 'local control over notes, drafts, and AI settings',
      },
    ],
    imageBrief: {
      keywords: 'writer desk notes local first newsletter workflow',
      mood: 'clean editorial workspace, warm daylight, focused',
      prompt:
        'An editorial desk with handwritten notes, RSS cards, a laptop draft, and subtle publishing icons, warm natural light, realistic, uncluttered.',
      selectedUrl: '',
      altText: 'A focused writing desk arranged around a newsletter publishing workflow.',
    },
    activity: [
      {
        id: makeId('activity'),
        at: createdAt,
        action: 'project-created',
        summary: 'Default local-first newsletter workspace created.',
        severity: 'info',
      },
    ],
  }
}
