import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeDollarSign,
  BookOpenText,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Mail,
  RefreshCw,
  Rss,
  Save,
  Search,
  Sparkles,
  Star,
  WandSparkles,
  X,
} from 'lucide-react'
import { generateSubjectLines } from './features/audience'
import { analyzeDraft, composeDraft, polishDraft, requestLocalLlm } from './features/drafting'
import { downloadText, makePlatformExports, projectFilename } from './features/exports'
import { generateImageBrief } from './features/images'
import { parseRssItems, searchSources } from './features/research'
import { loadLatestProject, resetProject, saveProject } from './features/workspace'
import { makeId, nowIso } from './lib/ids'
import { truncate } from './lib/text'
import type { AudienceSegment, NewsletterProject, ResearchSource, SourceKind } from './types'
import { useToast } from './components/Toast'

const repoUrl = 'https://github.com/baditaflorin/newsletter-flow'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'
const liveUrl = 'https://baditaflorin.github.io/newsletter-flow/'
const commitApiUrl = 'https://api.github.com/repos/baditaflorin/newsletter-flow/commits/main'

const blankSource: Omit<ResearchSource, 'id' | 'selected'> = {
  kind: 'note',
  title: '',
  url: '',
  author: '',
  publishedAt: '',
  summary: '',
  content: '',
  tags: [],
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-800">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-stone-500">{hint}</span> : null}
    </label>
  )
}

function inputClass(extra = '') {
  return `w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100 ${extra}`
}

function Button({
  children,
  icon,
  variant = 'primary',
  ...props
}: {
  children: ReactNode
  icon?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'border-stone-950 bg-stone-950 text-white hover:bg-stone-800',
    secondary: 'border-stone-300 bg-white text-stone-950 hover:bg-stone-50',
    ghost: 'border-transparent bg-transparent text-stone-700 hover:bg-stone-100',
  }

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${
        props.className ?? ''
      }`}
      type={props.type ?? 'button'}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
  actions,
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="border-t border-stone-200 bg-white" id={id}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">{title}</h2>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
    </div>
  )
}

function updateWithTimestamp(project: NewsletterProject): NewsletterProject {
  return { ...project, updatedAt: nowIso() }
}

async function fetchLatestCommit() {
  const response = await fetch(commitApiUrl, {
    headers: { Accept: 'application/vnd.github+json' },
  })

  if (!response.ok) throw new Error(`GitHub commit lookup failed with ${response.status}`)

  const payload = (await response.json()) as { sha?: string }
  return payload.sha?.slice(0, 7) || __APP_COMMIT__
}

function App() {
  const { notify } = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['latest-project'],
    queryFn: loadLatestProject,
  })
  const { data: latestCommit } = useQuery({
    queryKey: ['github-latest-commit'],
    queryFn: fetchLatestCommit,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const [project, setProject] = useState<NewsletterProject | null>(null)
  const [newSource, setNewSource] = useState(blankSource)
  const [rssXml, setRssXml] = useState('')
  const [rssError, setRssError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeExport, setActiveExport] = useState<'substack' | 'x' | 'linkedin'>('substack')
  const [saveState, setSaveState] = useState<'ready' | 'saving' | 'saved' | 'error'>('ready')
  const [llmError, setLlmError] = useState('')
  const [isLlmBusy, setIsLlmBusy] = useState(false)

  useEffect(() => {
    if (data) {
      setProject(data)
      setSaveState('saved')
    }
  }, [data])

  useEffect(() => {
    if (!project) return
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      saveProject(project)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 450)
    return () => window.clearTimeout(timeout)
  }, [project])

  const analysis = useMemo(() => analyzeDraft(project?.draft ?? ''), [project?.draft])
  const exports = useMemo(() => (project ? makePlatformExports(project) : null), [project])
  const subjectLines = useMemo(() => (project ? generateSubjectLines(project) : []), [project])
  const filteredSources = useMemo(
    () => (project ? searchSources(project.sources, searchQuery) : []),
    [project, searchQuery],
  )
  const selectedCount = project?.sources.filter((source) => source.selected).length ?? 0
  const displayCommit = latestCommit ?? __APP_COMMIT__
  const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(
    project?.imageBrief.keywords || 'newsletter writing desk',
  )}`

  function updateProject(updater: (current: NewsletterProject) => NewsletterProject) {
    setProject((current) => (current ? updateWithTimestamp(updater(current)) : current))
  }

  function updateIdea(field: keyof NewsletterProject['idea'], value: string) {
    updateProject((current) => ({
      ...current,
      idea: { ...current.idea, [field]: value },
      name: field === 'workingTitle' && value ? value : current.name,
    }))
  }

  function updateImageBrief(field: keyof NewsletterProject['imageBrief'], value: string) {
    updateProject((current) => ({
      ...current,
      imageBrief: { ...current.imageBrief, [field]: value },
    }))
  }

  function updateLlm(field: keyof NewsletterProject['llm'], value: string | boolean) {
    updateProject((current) => ({
      ...current,
      llm: { ...current.llm, [field]: value },
    }))
  }

  function addSource() {
    if (!newSource.title.trim() && !newSource.content.trim()) return
    const source: ResearchSource = {
      ...newSource,
      id: makeId('source'),
      selected: true,
      title: newSource.title.trim() || 'Untitled note',
      tags: newSource.tags,
    }
    updateProject((current) => ({ ...current, sources: [source, ...current.sources] }))
    setNewSource(blankSource)
    notify('Source added to the research stack.')
  }

  function importRss() {
    setRssError('')
    try {
      const items = parseRssItems(rssXml).slice(0, 20)
      if (!items.length) {
        setRssError('No RSS or Atom entries were found in that XML.')
        return
      }
      updateProject((current) => ({ ...current, sources: [...items, ...current.sources] }))
      setRssXml('')
      notify(`${items.length} RSS items imported.`)
    } catch (error) {
      setRssError(error instanceof Error ? error.message : 'RSS import failed.')
    }
  }

  function toggleSource(id: string) {
    updateProject((current) => ({
      ...current,
      sources: current.sources.map((source) =>
        source.id === id ? { ...source, selected: !source.selected } : source,
      ),
    }))
  }

  function removeSource(id: string) {
    updateProject((current) => ({
      ...current,
      sources: current.sources.filter((source) => source.id !== id),
    }))
  }

  function updateSegment(id: string, field: keyof AudienceSegment, value: string) {
    updateProject((current) => ({
      ...current,
      segments: current.segments.map((segment) =>
        segment.id === id ? { ...segment, [field]: value } : segment,
      ),
    }))
  }

  function addSegment() {
    updateProject((current) => ({
      ...current,
      segments: [
        ...current.segments,
        {
          id: makeId('segment'),
          name: 'New segment',
          painPoint: 'needs a sharper reason to open',
          desiredOutcome: 'gets a useful idea quickly',
        },
      ],
    }))
  }

  function removeSegment(id: string) {
    updateProject((current) => ({
      ...current,
      segments: current.segments.filter((segment) => segment.id !== id),
    }))
  }

  async function generateDraft() {
    if (!project) return
    setLlmError('')
    const fallback = composeDraft(project)

    if (!project.llm.enabled) {
      updateProject((current) => ({ ...current, draft: fallback }))
      notify('Draft generated locally.')
      return
    }

    try {
      setIsLlmBusy(true)
      const llmDraft = await requestLocalLlm({
        endpoint: project.llm.endpoint,
        model: project.llm.model,
        prompt: `Write a concise newsletter draft in Markdown using this project data:\n${JSON.stringify(
          {
            idea: project.idea,
            sources: project.sources.filter((source) => source.selected).slice(0, 8),
            segments: project.segments,
          },
          null,
          2,
        )}`,
      })
      updateProject((current) => ({ ...current, draft: llmDraft }))
      notify('Draft generated with your local LLM.')
    } catch (error) {
      setLlmError(error instanceof Error ? error.message : 'Local LLM request failed.')
      updateProject((current) => ({ ...current, draft: fallback }))
      notify('Local LLM was unavailable, so a local template draft was used.')
    } finally {
      setIsLlmBusy(false)
    }
  }

  async function polishCurrentDraft() {
    if (!project?.draft) return
    setLlmError('')

    if (project.llm.enabled) {
      try {
        setIsLlmBusy(true)
        const polished = await requestLocalLlm({
          endpoint: project.llm.endpoint,
          model: project.llm.model,
          prompt: `Polish this newsletter draft for clarity, active voice, and rhythm. Keep Markdown headings and do not add fake citations:\n\n${project.draft}`,
        })
        updateProject((current) => ({ ...current, draft: polished }))
        notify('Draft polished with your local LLM.')
        return
      } catch (error) {
        setLlmError(error instanceof Error ? error.message : 'Local LLM polish failed.')
      } finally {
        setIsLlmBusy(false)
      }
    }

    const result = polishDraft(project.draft)
    updateProject((current) => ({ ...current, draft: result.text }))
    notify(result.notes.join(' '))
  }

  function refreshImageBrief() {
    if (!project) return
    const brief = generateImageBrief(project)
    updateProject((current) => ({
      ...current,
      imageBrief: { ...current.imageBrief, ...brief },
    }))
    notify('Image brief refreshed from the current idea and sources.')
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    notify(`${label} copied.`)
  }

  async function startFresh() {
    const fresh = await resetProject()
    setProject(fresh)
    notify('A fresh project is ready.')
  }

  if (isLoading || !project || !exports) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 text-stone-950">
        <div className="flex items-center gap-3 text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading local workspace
        </div>
      </main>
    )
  }

  const activeExportText =
    activeExport === 'substack'
      ? exports.substack
      : activeExport === 'linkedin'
        ? exports.linkedIn
        : exports.xThread.join('\n\n')

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950" data-testid="app-shell">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3 font-semibold text-stone-950" href={liveUrl}>
            <span className="grid h-10 w-10 place-items-center bg-teal-700 text-white">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Newsletter Flow</span>
          </a>
          <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Project links">
            <a
              className="inline-flex min-h-10 items-center gap-2 border border-stone-300 bg-white px-3 py-2 font-semibold text-stone-950 hover:bg-stone-50"
              href={repoUrl}
              rel="noreferrer"
              target="_blank"
              title="Open the GitHub repository"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              Star on GitHub
            </a>
            <a
              className="inline-flex min-h-10 items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 font-semibold text-amber-950 hover:bg-amber-100"
              href={paypalUrl}
              rel="noreferrer"
              target="_blank"
              title="Support via PayPal"
            >
              <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
              Support
            </a>
          </nav>
        </div>
      </header>

      <section className="bg-stone-100">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase text-teal-700">Daily flow map</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-stone-950 sm:text-5xl">
              One local workspace from idea to publish-ready copy.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-stone-700">
              Capture the thought, gather sources, draft the argument, polish the rhythm, plan the
              image, and export for Substack, X, and LinkedIn.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <span className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-2">
                <Save className="h-4 w-4 text-teal-700" aria-hidden="true" />
                {saveState === 'saved'
                  ? 'Saved locally'
                  : saveState === 'saving'
                    ? 'Saving'
                    : 'Ready'}
              </span>
              <span className="border border-stone-300 bg-white px-3 py-2">
                Version {__APP_VERSION__}
              </span>
              <span className="border border-stone-300 bg-white px-3 py-2">
                Commit {displayCommit}
              </span>
            </div>
          </div>

          <div className="grid gap-2 self-center" aria-label="Newsletter workflow map">
            {[
              ['01', 'Capture', 'Idea, audience, promise'],
              ['02', 'Research', 'Notes, RSS, local search'],
              ['03', 'Draft', 'Template or local LLM'],
              ['04', 'Polish', 'Readability and grammar pass'],
              ['05', 'Repurpose', 'Substack, X, LinkedIn'],
            ].map(([number, label, detail]) => (
              <div
                className="grid grid-cols-[3rem_1fr] border border-stone-300 bg-white"
                key={label}
              >
                <span className="grid place-items-center bg-stone-950 text-sm font-bold text-white">
                  {number}
                </span>
                <span className="px-4 py-3">
                  <strong className="block text-sm text-stone-950">{label}</strong>
                  <span className="text-sm text-stone-600">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section
        id="idea"
        eyebrow="01 Capture"
        title="Idea Brief"
        actions={
          <Button
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={startFresh}
            variant="secondary"
          >
            New project
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Working title">
            <input
              className={inputClass()}
              data-testid="idea-title"
              value={project.idea.workingTitle}
              onChange={(event) => updateIdea('workingTitle', event.target.value)}
            />
          </Field>
          <Field label="Audience">
            <input
              className={inputClass()}
              value={project.idea.audience}
              onChange={(event) => updateIdea('audience', event.target.value)}
            />
          </Field>
          <Field label="Angle">
            <input
              className={inputClass()}
              value={project.idea.angle}
              onChange={(event) => updateIdea('angle', event.target.value)}
            />
          </Field>
          <Field label="Promise">
            <input
              className={inputClass()}
              value={project.idea.promise}
              onChange={(event) => updateIdea('promise', event.target.value)}
            />
          </Field>
          <Field label="Raw notes">
            <textarea
              className={inputClass('min-h-36 resize-y')}
              value={project.idea.notes}
              onChange={(event) => updateIdea('notes', event.target.value)}
            />
          </Field>
          <div className="grid gap-3">
            <Metric label="Sources selected" value={`${selectedCount}/${project.sources.length}`} />
            <Metric label="Draft words" value={analysis.wordCount} />
            <Metric label="Reading time" value={`${analysis.readingMinutes} min`} />
          </div>
        </div>
      </Section>

      <Section
        id="research"
        eyebrow="02 Research"
        title="Research Stack"
        actions={
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400"
              aria-hidden="true"
            />
            <input
              aria-label="Search sources"
              className={inputClass('pl-9')}
              placeholder="Search sources"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4">
            <div className="grid gap-3 border border-stone-200 bg-stone-50 p-4">
              <Field label="Source title">
                <input
                  className={inputClass()}
                  value={newSource.title}
                  onChange={(event) =>
                    setNewSource((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
              <Field label="URL">
                <input
                  className={inputClass()}
                  value={newSource.url}
                  onChange={(event) =>
                    setNewSource((current) => ({ ...current, url: event.target.value }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Kind">
                  <select
                    className={inputClass()}
                    value={newSource.kind}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setNewSource((current) => ({
                        ...current,
                        kind: event.target.value as SourceKind,
                      }))
                    }
                  >
                    <option value="note">Note</option>
                    <option value="article">Article</option>
                    <option value="rss">RSS</option>
                  </select>
                </Field>
                <Field label="Tags">
                  <input
                    className={inputClass()}
                    placeholder="cost, workflow"
                    value={newSource.tags.join(', ')}
                    onChange={(event) =>
                      setNewSource((current) => ({
                        ...current,
                        tags: event.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Summary">
                <textarea
                  className={inputClass('min-h-24 resize-y')}
                  value={newSource.summary}
                  onChange={(event) =>
                    setNewSource((current) => ({ ...current, summary: event.target.value }))
                  }
                />
              </Field>
              <Field label="Content">
                <textarea
                  className={inputClass('min-h-28 resize-y')}
                  value={newSource.content}
                  onChange={(event) =>
                    setNewSource((current) => ({ ...current, content: event.target.value }))
                  }
                />
              </Field>
              <Button
                icon={<BookOpenText className="h-4 w-4" aria-hidden="true" />}
                onClick={addSource}
              >
                Add source
              </Button>
            </div>

            <div className="grid gap-3 border border-stone-200 bg-stone-50 p-4">
              <Field label="Paste RSS or Atom XML">
                <textarea
                  className={inputClass('min-h-32 resize-y')}
                  value={rssXml}
                  onChange={(event) => setRssXml(event.target.value)}
                />
              </Field>
              {rssError ? <p className="text-sm text-rose-700">{rssError}</p> : null}
              <Button
                icon={<Rss className="h-4 w-4" aria-hidden="true" />}
                onClick={importRss}
                variant="secondary"
              >
                Import RSS
              </Button>
            </div>
          </div>

          <div className="grid gap-3 content-start">
            {filteredSources.map((source) => (
              <article className="border border-stone-200 bg-white p-4" key={source.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-stone-500">{source.kind}</p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-950">{source.title}</h3>
                    {source.url ? (
                      <a
                        className="mt-1 inline-flex items-center gap-1 break-all text-sm text-teal-700 hover:text-teal-900"
                        href={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.url}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleSource(source.id)}
                      variant={source.selected ? 'primary' : 'secondary'}
                    >
                      {source.selected ? 'Selected' : 'Use'}
                    </Button>
                    <Button
                      aria-label={`Remove ${source.title}`}
                      icon={<X className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => removeSource(source.id)}
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-stone-700">
                  {source.summary || truncate(source.content, 220)}
                </p>
                {source.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {source.tags.map((tag) => (
                      <span
                        className="border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-900"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="draft"
        eyebrow="03 Draft"
        title="Draft Studio"
        actions={
          <>
            <Button
              data-testid="generate-draft"
              disabled={isLlmBusy}
              icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              onClick={generateDraft}
            >
              Generate draft
            </Button>
            <Button
              disabled={!project.draft || isLlmBusy}
              icon={<WandSparkles className="h-4 w-4" aria-hidden="true" />}
              onClick={polishCurrentDraft}
              variant="secondary"
            >
              Polish
            </Button>
          </>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
          <div className="grid gap-3">
            <textarea
              aria-label="Newsletter draft"
              className={inputClass('min-h-[32rem] resize-y font-mono text-sm leading-6')}
              data-testid="draft-editor"
              value={project.draft}
              onChange={(event) =>
                updateProject((current) => ({ ...current, draft: event.target.value }))
              }
            />
            {llmError ? (
              <p className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                {llmError}
              </p>
            ) : null}
          </div>
          <aside className="grid content-start gap-3">
            <Metric label="Words" value={analysis.wordCount} />
            <Metric label="Long sentences" value={analysis.longSentences.length} />
            <Metric label="Passive flags" value={analysis.passiveMatches.length} />
            <Metric label="Hedges" value={analysis.hedgeMatches.length} />
            <div className="border border-stone-200 bg-stone-50 p-4">
              <h3 className="font-semibold text-stone-950">Local LLM</h3>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  checked={project.llm.enabled}
                  type="checkbox"
                  onChange={(event) => updateLlm('enabled', event.target.checked)}
                />
                Use Ollama-style endpoint
              </label>
              <Field label="Endpoint">
                <input
                  className={inputClass()}
                  value={project.llm.endpoint}
                  onChange={(event) => updateLlm('endpoint', event.target.value)}
                />
              </Field>
              <Field label="Model">
                <input
                  className={inputClass()}
                  value={project.llm.model}
                  onChange={(event) => updateLlm('model', event.target.value)}
                />
              </Field>
            </div>
          </aside>
        </div>
      </Section>

      <Section
        id="image"
        eyebrow="04 Image"
        title="Image Brief"
        actions={
          <Button
            icon={<ImageIcon className="h-4 w-4" aria-hidden="true" />}
            onClick={refreshImageBrief}
          >
            Refresh brief
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="grid gap-4">
            <Field label="Keywords">
              <input
                className={inputClass()}
                value={project.imageBrief.keywords}
                onChange={(event) => updateImageBrief('keywords', event.target.value)}
              />
            </Field>
            <Field label="Mood">
              <input
                className={inputClass()}
                value={project.imageBrief.mood}
                onChange={(event) => updateImageBrief('mood', event.target.value)}
              />
            </Field>
            <Field label="Image prompt">
              <textarea
                className={inputClass('min-h-28 resize-y')}
                value={project.imageBrief.prompt}
                onChange={(event) => updateImageBrief('prompt', event.target.value)}
              />
            </Field>
            <Field label="Selected image URL">
              <input
                className={inputClass()}
                value={project.imageBrief.selectedUrl}
                onChange={(event) => updateImageBrief('selectedUrl', event.target.value)}
              />
            </Field>
            <Field label="Alt text">
              <input
                className={inputClass()}
                value={project.imageBrief.altText}
                onChange={(event) => updateImageBrief('altText', event.target.value)}
              />
            </Field>
          </div>
          <div className="grid content-start gap-3">
            <div className="aspect-[4/3] overflow-hidden border border-stone-300 bg-stone-100">
              {project.imageBrief.selectedUrl ? (
                <img
                  alt={project.imageBrief.altText}
                  className="h-full w-full object-cover"
                  src={project.imageBrief.selectedUrl}
                />
              ) : (
                <div className="grid h-full place-items-center p-6 text-center text-sm text-stone-600">
                  Paste an image URL to preview the newsletter visual.
                </div>
              )}
            </div>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-50"
              href={unsplashUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open Unsplash search
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Section>

      <Section
        id="audience"
        eyebrow="05 Segment"
        title="Subject Lines"
        actions={
          <Button
            icon={<Check className="h-4 w-4" aria-hidden="true" />}
            onClick={addSegment}
            variant="secondary"
          >
            Add segment
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 content-start">
            {project.segments.map((segment) => (
              <article
                className="grid gap-3 border border-stone-200 bg-stone-50 p-4"
                key={segment.id}
              >
                <Field label="Name">
                  <input
                    className={inputClass()}
                    value={segment.name}
                    onChange={(event) => updateSegment(segment.id, 'name', event.target.value)}
                  />
                </Field>
                <Field label="Pain point">
                  <input
                    className={inputClass()}
                    value={segment.painPoint}
                    onChange={(event) => updateSegment(segment.id, 'painPoint', event.target.value)}
                  />
                </Field>
                <Field label="Desired outcome">
                  <input
                    className={inputClass()}
                    value={segment.desiredOutcome}
                    onChange={(event) =>
                      updateSegment(segment.id, 'desiredOutcome', event.target.value)
                    }
                  />
                </Field>
                <Button onClick={() => removeSegment(segment.id)} variant="ghost">
                  Remove segment
                </Button>
              </article>
            ))}
          </div>
          <div className="grid gap-3 content-start">
            {subjectLines.map((group) => (
              <article className="border border-stone-200 bg-white p-4" key={group.segment}>
                <h3 className="font-semibold text-stone-950">{group.segment}</h3>
                <ul className="mt-3 grid gap-2">
                  {group.lines.map((line) => (
                    <li
                      className="flex items-start justify-between gap-3 border border-stone-100 bg-stone-50 p-3"
                      key={line}
                    >
                      <span className="text-sm text-stone-800">{line}</span>
                      <button
                        aria-label={`Copy subject line ${line}`}
                        className="grid h-8 w-8 shrink-0 place-items-center border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                        type="button"
                        onClick={() => copyText(line, 'Subject line')}
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="exports"
        eyebrow="06 Export"
        title="Platform Formats"
        actions={
          <>
            <Button
              data-testid="export-substack"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                downloadText(projectFilename(project.name, 'md'), exports.substack, 'text/markdown')
              }
            >
              Markdown
            </Button>
            <Button
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                downloadText(
                  projectFilename(project.name, 'json'),
                  exports.projectJson,
                  'application/json',
                )
              }
              variant="secondary"
            >
              Project JSON
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Export formats">
            {[
              ['substack', 'Substack'],
              ['x', 'X thread'],
              ['linkedin', 'LinkedIn'],
            ].map(([id, label]) => (
              <button
                aria-selected={activeExport === id}
                className={`border px-3 py-2 text-sm font-semibold ${
                  activeExport === id
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-300 bg-white text-stone-950'
                }`}
                key={id}
                role="tab"
                type="button"
                onClick={() => setActiveExport(id as typeof activeExport)}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Selected export"
            className={inputClass('min-h-96 resize-y font-mono text-sm leading-6')}
            readOnly
            value={activeExportText}
          />
          <Button
            icon={<Copy className="h-4 w-4" aria-hidden="true" />}
            onClick={() => copyText(activeExportText, 'Export')}
            variant="secondary"
          >
            Copy current export
          </Button>
        </div>
      </Section>

      <footer className="border-t border-stone-200 bg-stone-950 text-stone-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm sm:px-6 lg:px-8">
          <p>
            Newsletter Flow v{__APP_VERSION__} · commit {displayCommit}
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="hover:text-white" href={repoUrl} rel="noreferrer" target="_blank">
              {repoUrl}
            </a>
            <a className="hover:text-white" href={paypalUrl} rel="noreferrer" target="_blank">
              {paypalUrl}
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
