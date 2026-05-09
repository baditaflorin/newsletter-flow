import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeDollarSign,
  BookOpenText,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Info,
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
import { analyzeNewsletterInputCached, inputCacheStats, searchSources } from './features/research'
import { clearLocalProjects, loadLatestProject, saveProject } from './features/workspace'
import { createBlankProject, createDefaultProject } from './lib/demo'
import { makeId, nowIso } from './lib/ids'
import { makeProjectShareUrl, parseProjectShareHash } from './lib/project-io'
import { parseSourceKind, sourceHasEvidence, sourceKindOptions } from './lib/sources'
import { truncate } from './lib/text'
import type {
  ActivityEntry,
  AudienceSegment,
  InferenceResult,
  NewsletterProject,
  ResearchSource,
  SourceShape,
} from './types'
import { useToast } from './components/Toast'

const repoUrl = 'https://github.com/baditaflorin/newsletter-flow'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'
const liveUrl = 'https://baditaflorin.github.io/newsletter-flow/'
const supportedFileExtensions = [
  '.txt',
  '.md',
  '.markdown',
  '.xml',
  '.rss',
  '.atom',
  '.opml',
  '.html',
  '.htm',
  '.json',
]
const exportTabs = [
  { id: 'substack', label: 'Substack' },
  { id: 'x', label: 'X thread' },
  { id: 'linkedin', label: 'LinkedIn' },
] as const
type ExportTabId = (typeof exportTabs)[number]['id']

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

function makeActivity(
  action: string,
  summary: string,
  severity: ActivityEntry['severity'] = 'info',
  metadata?: ActivityEntry['metadata'],
): ActivityEntry {
  return { id: makeId('activity'), at: nowIso(), action, summary, severity, metadata }
}

function appendActivity(project: NewsletterProject, entry: ActivityEntry) {
  return { ...project, activity: [entry, ...(project.activity ?? [])].slice(0, 80) }
}

interface FileImportRow {
  name: string
  status: 'imported' | 'skipped' | 'error'
  summary: string
}

interface TextPayload {
  name: string
  text: string
}

function isSupportedTextFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    file.type.includes('xml') ||
    supportedFileExtensions.some((extension) => name.endsWith(extension))
  )
}

function App() {
  const { notify } = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['latest-project'],
    queryFn: loadLatestProject,
  })

  const [project, setProject] = useState<NewsletterProject | null>(null)
  const [newSource, setNewSource] = useState(blankSource)
  const [rssXml, setRssXml] = useState('')
  const [inputAnalysis, setInputAnalysis] = useState<InferenceResult | null>(null)
  const [importState, setImportState] = useState<
    | 'import-idle'
    | 'import-analyzing'
    | 'import-ready'
    | 'import-committing'
    | 'imported-with-warnings'
    | 'error-recoverable'
    | 'cancelled'
  >('import-idle')
  const [selectionPreferences, setSelectionPreferences] = useState<
    Partial<Record<SourceShape, boolean>>
  >({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeExport, setActiveExport] = useState<ExportTabId>('substack')
  const [saveState, setSaveState] = useState<'ready' | 'saving' | 'saved' | 'error'>('ready')
  const [llmError, setLlmError] = useState('')
  const [isLlmBusy, setIsLlmBusy] = useState(false)
  const [fileImportRows, setFileImportRows] = useState<FileImportRow[]>([])
  const [isDraggingSource, setIsDraggingSource] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [shareUrlPreview, setShareUrlPreview] = useState('')
  const importOperationRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hashImportRef = useRef(false)
  const isDebug = useMemo(
    () => new URLSearchParams(window.location.search).get('debug') === '1',
    [],
  )

  useEffect(() => {
    if (data) {
      if (hashImportRef.current) return
      setProject(data)
      setSaveState('saved')
    }
  }, [data])

  useEffect(() => {
    const importProjectFromHash = () => {
      if (!window.location.hash.startsWith('#project=')) return
      try {
        const shared = parseProjectShareHash(window.location.hash)
        if (!shared) return
        hashImportRef.current = true
        setProject(
          appendActivity(
            { ...shared, updatedAt: nowIso() },
            makeActivity('project-imported', 'Project imported from a share URL.', 'info'),
          ),
        )
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        notify('Shared project loaded into this browser.')
        setSaveState('saved')
      } catch {
        notify('That share link could not be read. Ask for a project JSON backup instead.')
      }
    }

    importProjectFromHash()
    window.addEventListener('hashchange', importProjectFromHash)
    return () => window.removeEventListener('hashchange', importProjectFromHash)
  }, [notify])

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

  useEffect(() => {
    if (!project) return
    const raw = rssXml
    if (!raw.trim()) {
      setInputAnalysis(null)
      setImportState('import-idle')
      return
    }

    const operationId = importOperationRef.current + 1
    importOperationRef.current = operationId
    setImportState('import-analyzing')

    const timeout = window.setTimeout(() => {
      if (importOperationRef.current !== operationId) return
      try {
        const analysis = analyzeNewsletterInputCached(raw, project)
        const sources = analysis.sources.map((source) => {
          const shape = source.provenance?.shape
          const preference = shape ? selectionPreferences[shape] : undefined
          if (!shape || preference === undefined) return source
          return {
            ...source,
            selected: preference && sourceHasEvidence(source),
            reasoning: [
              ...(source.reasoning ?? []),
              `Applied your session preference for ${shape.replaceAll('_', ' ')} sources.`,
            ],
          }
        })
        setInputAnalysis({ ...analysis, sources })
        setImportState('import-ready')
      } catch {
        setInputAnalysis(null)
        setImportState('error-recoverable')
      }
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [project, rssXml, selectionPreferences])

  const analysis = useMemo(() => analyzeDraft(project?.draft ?? ''), [project?.draft])
  const exports = useMemo(() => (project ? makePlatformExports(project) : null), [project])
  const subjectLines = useMemo(() => (project ? generateSubjectLines(project) : []), [project])
  const filteredSources = useMemo(
    () => (project ? searchSources(project.sources, searchQuery) : []),
    [project, searchQuery],
  )
  const selectedCount = project?.sources.filter((source) => source.selected).length ?? 0
  const displayCommit = __APP_COMMIT__
  const workspaceState =
    !project?.sources.length && !project?.draft
      ? 'loaded-empty'
      : (project?.sources.length ?? 0) > 100
        ? 'loaded-many'
        : 'loaded-some'
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

  function commitAnalyses(payloads: TextPayload[]) {
    if (!project) return
    const rows: FileImportRow[] = []
    const analyses = payloads.map((payload) => ({
      payload,
      analysis: analyzeNewsletterInputCached(payload.text, project),
    }))

    if (analyses.length === 1 && analyses[0].analysis.importedProject) {
      const imported = analyses[0].analysis.importedProject
      setProject(
        appendActivity(
          { ...imported, updatedAt: nowIso() },
          makeActivity(
            'project-imported',
            `Project imported from ${analyses[0].payload.name}.`,
            'info',
          ),
        ),
      )
      setFileImportRows([
        {
          name: analyses[0].payload.name,
          status: 'imported',
          summary: 'Project state restored from JSON.',
        },
      ])
      notify('Project JSON imported.')
      return
    }

    updateProject((current) => {
      let next = current
      for (const { payload, analysis: result } of analyses) {
        if (result.importedProject) {
          rows.push({
            name: payload.name,
            status: 'skipped',
            summary: 'Project JSON is only imported when it is the only selected file.',
          })
          continue
        }
        const nextSources = result.sources.filter(sourceHasEvidence)
        if (!nextSources.length) {
          rows.push({
            name: payload.name,
            status: result.issues.length ? 'error' : 'skipped',
            summary: result.issues[0]?.what ?? 'No usable source evidence was found in this file.',
          })
          continue
        }
        next = {
          ...next,
          name: result.suggestedIdea?.workingTitle || next.name,
          idea: result.suggestedIdea
            ? {
                ...next.idea,
                ...Object.fromEntries(
                  Object.entries(result.suggestedIdea).filter(
                    ([, value]) => typeof value === 'string' && value.trim(),
                  ),
                ),
              }
            : next.idea,
          sources: [...nextSources, ...next.sources],
        }
        rows.push({
          name: payload.name,
          status: 'imported',
          summary: `${nextSources.length} source${nextSources.length === 1 ? '' : 's'} imported as ${result.shape.replaceAll('_', ' ')}.`,
        })
      }

      return appendActivity(
        next,
        makeActivity(
          'files-imported',
          `${rows.filter((row) => row.status === 'imported').length}/${rows.length} file imports completed.`,
          rows.some((row) => row.status === 'error') ? 'warning' : 'info',
        ),
      )
    })
    setFileImportRows(rows)
    notify(
      `${rows.filter((row) => row.status === 'imported').length}/${rows.length} file imports completed.`,
    )
  }

  async function importFiles(files: FileList | File[]) {
    const fileList = Array.from(files)
    if (!fileList.length) return
    const rows: FileImportRow[] = []
    const payloads: TextPayload[] = []

    for (const file of fileList) {
      if (!isSupportedTextFile(file)) {
        rows.push({
          name: file.name,
          status: 'skipped',
          summary: 'Unsupported file type. Use TXT, Markdown, XML, RSS, Atom, OPML, HTML, or JSON.',
        })
        continue
      }
      if (file.size > 3_000_000) {
        rows.push({
          name: file.name,
          status: 'skipped',
          summary: 'File is larger than the 3 MB browser import budget.',
        })
        continue
      }
      try {
        payloads.push({ name: file.name, text: await file.text() })
      } catch {
        rows.push({
          name: file.name,
          status: 'error',
          summary: 'The browser could not read this file. Try pasting its contents instead.',
        })
      }
    }

    setFileImportRows(rows)
    if (payloads.length) {
      commitAnalyses(payloads)
    } else if (rows.length) {
      notify('No supported files were imported.')
    }
  }

  async function readClipboardIntoInput() {
    if (!navigator.clipboard?.readText) {
      notify('Clipboard read is unavailable here. Paste into the source input box instead.')
      return
    }
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        notify('Clipboard is empty. Paste source text or choose a file.')
        return
      }
      setRssXml(text)
      notify('Clipboard text loaded for preview.')
    } catch {
      notify('Clipboard permission was blocked. Paste into the source input box instead.')
    }
  }

  function addSource() {
    if (!newSource.title.trim() && !newSource.content.trim()) return
    const source: ResearchSource = {
      ...newSource,
      id: makeId('source'),
      selected: true,
      title: newSource.title.trim() || 'Untitled note',
      tags: newSource.tags,
      confidence: {
        score: newSource.content.trim() || newSource.summary.trim() ? 0.72 : 0.44,
        label: newSource.content.trim() || newSource.summary.trim() ? 'medium' : 'low',
        reasons: ['Manually added source.'],
      },
      issues: sourceHasEvidence({
        title: newSource.title.trim() || 'Untitled note',
        summary: newSource.summary,
        content: newSource.content,
      })
        ? []
        : [
            {
              code: 'LOW_CONTENT_CONFIDENCE',
              severity: 'warning',
              what: 'This source has little usable evidence.',
              why: 'A title alone is not enough to support a newsletter claim.',
              nextStep: 'Add a summary or excerpt before using it in a draft.',
            },
          ],
      provenance: {
        inputKind: 'plain_text',
        shape: newSource.kind === 'article' ? 'article_text' : 'brief',
        inputHash: `manual-${makeId('input')}`,
        sourceIndex: 0,
        originalUrl: newSource.url || undefined,
      },
      reasoning: ['Added manually by the user.'],
    }
    updateProject((current) =>
      appendActivity(
        { ...current, sources: [source, ...current.sources] },
        makeActivity('source-added', `Manual source added: ${source.title}`, 'info'),
      ),
    )
    setNewSource(blankSource)
    notify('Source added to the research stack.')
  }

  function cancelImport() {
    importOperationRef.current += 1
    setRssXml('')
    setInputAnalysis(null)
    setImportState('cancelled')
    updateProject((current) =>
      appendActivity(
        current,
        makeActivity('import-cancelled', 'Source input analysis was cancelled.', 'info'),
      ),
    )
  }

  function commitInference() {
    if (!inputAnalysis) return
    setImportState('import-committing')
    updateProject((current) => {
      if (inputAnalysis.importedProject) {
        return appendActivity(
          {
            ...inputAnalysis.importedProject,
            activity: inputAnalysis.importedProject.activity ?? [],
            updatedAt: nowIso(),
          },
          makeActivity(
            'project-imported',
            'Project JSON was imported from the research input box.',
            'info',
          ),
        )
      }

      const suggestedIdea = inputAnalysis.suggestedIdea
      const nextSources = inputAnalysis.sources.filter(sourceHasEvidence)
      const merged = {
        ...current,
        name: suggestedIdea?.workingTitle || current.name,
        idea: suggestedIdea
          ? {
              ...current.idea,
              ...Object.fromEntries(
                Object.entries(suggestedIdea).filter(
                  ([, value]) => typeof value === 'string' && value.trim(),
                ),
              ),
            }
          : current.idea,
        sources: [...nextSources, ...current.sources],
      }
      return appendActivity(
        merged,
        makeActivity(
          'input-imported',
          `${inputAnalysis.inputKind.replaceAll('_', ' ')} import committed with ${nextSources.length} source${nextSources.length === 1 ? '' : 's'}.`,
          inputAnalysis.issues.some((issue) => issue.severity !== 'info') ? 'warning' : 'info',
          {
            found: inputAnalysis.report.found,
            imported: nextSources.length,
            skipped: inputAnalysis.report.skipped,
          },
        ),
      )
    })
    setRssXml('')
    setInputAnalysis(null)
    setImportState(inputAnalysis.issues.length ? 'imported-with-warnings' : 'import-idle')
    notify(
      inputAnalysis.issues.length
        ? `${inputAnalysis.report.imported} source guesses imported with warnings.`
        : `${inputAnalysis.report.imported} source guesses imported.`,
    )
  }

  function toggleSource(id: string) {
    updateProject((current) => ({
      ...current,
      sources: current.sources.map((source) =>
        source.id === id ? { ...source, selected: !source.selected } : source,
      ),
    }))
    const source = project?.sources.find((item) => item.id === id)
    const shape = source?.provenance?.shape
    if (shape) {
      setSelectionPreferences((current) => ({ ...current, [shape]: !source.selected }))
    }
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
      updateProject((current) =>
        appendActivity(
          { ...current, draft: fallback },
          makeActivity('draft-generated', 'Draft generated from selected local evidence.', 'info', {
            selectedSources: current.sources.filter((source) => source.selected).length,
          }),
        ),
      )
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
      updateProject((current) =>
        appendActivity(
          { ...current, draft: llmDraft },
          makeActivity(
            'draft-generated',
            'Draft generated with the configured local LLM endpoint.',
            'info',
          ),
        ),
      )
      notify('Draft generated with your local LLM.')
    } catch (error) {
      setLlmError(error instanceof Error ? error.message : 'Local LLM request failed.')
      updateProject((current) =>
        appendActivity(
          { ...current, draft: fallback },
          makeActivity(
            'draft-fallback',
            'Local LLM failed; deterministic local draft was used instead.',
            'recoverable',
          ),
        ),
      )
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
        updateProject((current) =>
          appendActivity(
            { ...current, draft: polished },
            makeActivity(
              'draft-polished',
              'Draft polished with the configured local LLM endpoint.',
              'info',
            ),
          ),
        )
        notify('Draft polished with your local LLM.')
        return
      } catch (error) {
        setLlmError(error instanceof Error ? error.message : 'Local LLM polish failed.')
      } finally {
        setIsLlmBusy(false)
      }
    }

    const result = polishDraft(project.draft)
    updateProject((current) =>
      appendActivity(
        { ...current, draft: result.text },
        makeActivity('draft-polished', result.notes.join(' '), 'info'),
      ),
    )
    notify(result.notes.join(' '))
  }

  function refreshImageBrief() {
    if (!project) return
    const brief = generateImageBrief(project)
    updateProject((current) => ({
      ...appendActivity(
        current,
        makeActivity(
          'image-brief-refreshed',
          'Image brief refreshed from current idea and source tags.',
          'info',
        ),
      ),
      imageBrief: { ...current.imageBrief, ...brief },
    }))
    notify('Image brief refreshed from the current idea and sources.')
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      updateProject((current) =>
        appendActivity(
          current,
          makeActivity('export-copied', `${label} copied to clipboard.`, 'info'),
        ),
      )
      notify(`${label} copied.`)
    } catch {
      notify(`Could not copy ${label}. Select the text and copy it manually.`)
    }
  }

  function downloadExport(filename: string, contents: string, type: string, label: string) {
    downloadText(filename, contents, type)
    updateProject((current) =>
      appendActivity(current, makeActivity('export-downloaded', `${label} downloaded.`, 'info')),
    )
  }

  async function startFresh() {
    const fresh = createDefaultProject()
    setProject(fresh)
    setRssXml('')
    setInputAnalysis(null)
    setFileImportRows([])
    saveProject(fresh).catch(() => setSaveState('error'))
    notify('The demo project is ready.')
  }

  async function startBlankProject() {
    const fresh = createBlankProject()
    setProject(fresh)
    setRssXml('')
    setInputAnalysis(null)
    setFileImportRows([])
    saveProject(fresh).catch(() => setSaveState('error'))
    notify('A blank project is ready.')
  }

  async function clearLocalData() {
    const fresh = await clearLocalProjects()
    setProject(fresh)
    setRssXml('')
    setInputAnalysis(null)
    setFileImportRows([])
    notify('Local project data was cleared. A blank project is ready.')
  }

  async function copyShareUrl() {
    if (!project) return
    const share = makeProjectShareUrl(project, window.location.href)
    setShareStatus(
      share.tooLarge
        ? `This project is too large for a share URL (${share.bytes}/${share.maxBytes} bytes). Download Project JSON instead.`
        : `Share URL ready (${share.bytes}/${share.maxBytes} bytes).`,
    )
    setShareUrlPreview(share.tooLarge ? '' : share.url)
    if (share.tooLarge) {
      notify('This project is too large for a share URL. Download Project JSON instead.')
      return
    }
    await copyText(share.url, 'Share URL')
  }

  function printCurrentDraft() {
    window.print()
    updateProject((current) =>
      appendActivity(
        current,
        makeActivity('draft-print-opened', 'Browser print dialog opened.', 'info'),
      ),
    )
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
          <>
            <Button
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
              onClick={startFresh}
              variant="secondary"
            >
              Demo project
            </Button>
            <Button onClick={startBlankProject} variant="secondary">
              Blank project
            </Button>
            <Button onClick={clearLocalData} variant="ghost">
              Clear local data
            </Button>
          </>
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
                        kind: parseSourceKind(event.target.value),
                      }))
                    }
                  >
                    {sourceKindOptions.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind === 'rss' ? 'RSS' : kind[0].toUpperCase() + kind.slice(1)}
                      </option>
                    ))}
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

            <div
              className={`grid gap-3 border p-4 ${
                isDraggingSource ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-stone-50'
              }`}
              onDragLeave={() => setIsDraggingSource(false)}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDraggingSource(true)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDraggingSource(false)
                void importFiles(event.dataTransfer.files)
              }}
            >
              <Field
                label="Paste source input"
                hint="Briefs, RSS, Atom, OPML, article HTML, article text, URL-only sources, and project JSON are detected automatically."
              >
                <textarea
                  className={inputClass('min-h-32 resize-y')}
                  data-testid="source-input"
                  placeholder="Paste a feed, article, URL, OPML list, or rough newsletter brief."
                  value={rssXml}
                  onChange={(event) => setRssXml(event.target.value)}
                />
              </Field>
              <input
                ref={fileInputRef}
                accept=".txt,.md,.markdown,.xml,.rss,.atom,.opml,.html,.htm,.json,text/*,application/json,application/xml"
                className="sr-only"
                data-testid="source-file-input"
                multiple
                type="file"
                onChange={(event) => {
                  void importFiles(event.target.files ?? [])
                  event.target.value = ''
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                  Import files
                </Button>
                <Button onClick={readClipboardIntoInput} variant="secondary">
                  Read clipboard
                </Button>
              </div>
              <p className="text-xs text-stone-500">
                Drop TXT, Markdown, RSS, Atom, OPML, HTML, or Project JSON files here. Unsupported
                or oversized files are skipped with a reason.
              </p>
              {fileImportRows.length ? (
                <div className="grid gap-2" data-testid="file-import-results">
                  {fileImportRows.map((row) => (
                    <div
                      className={`border p-2 text-sm ${
                        row.status === 'imported'
                          ? 'border-teal-200 bg-teal-50 text-teal-950'
                          : row.status === 'skipped'
                            ? 'border-stone-200 bg-white text-stone-700'
                            : 'border-amber-200 bg-amber-50 text-amber-950'
                      }`}
                      key={`${row.name}-${row.summary}`}
                    >
                      <strong>{row.name}</strong>
                      <p>{row.summary}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {importState === 'import-analyzing' ? (
                <p className="flex items-center gap-2 text-sm text-stone-700">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Reading source shape...
                </p>
              ) : null}
              {inputAnalysis ? (
                <div
                  className="grid gap-3 border border-teal-200 bg-white p-3"
                  data-testid="input-preview"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="border border-stone-300 bg-stone-50 px-2 py-1 font-semibold uppercase text-stone-700">
                      {inputAnalysis.inputKind.replaceAll('_', ' ')}
                    </span>
                    <span className="border border-stone-300 bg-stone-50 px-2 py-1">
                      {inputAnalysis.shape.replaceAll('_', ' ')}
                    </span>
                    <span className="border border-stone-300 bg-stone-50 px-2 py-1">
                      confidence {inputAnalysis.confidence.label} ({inputAnalysis.confidence.score})
                    </span>
                    <span className="border border-stone-300 bg-stone-50 px-2 py-1">
                      {inputAnalysis.report.found} found · {inputAnalysis.report.imported} ready ·{' '}
                      {inputAnalysis.report.skipped} skipped
                    </span>
                  </div>
                  {inputAnalysis.issues.length ? (
                    <div className="grid gap-2">
                      {inputAnalysis.issues.map((issue) => (
                        <div
                          className="border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950"
                          key={issue.code}
                        >
                          <strong>{issue.what}</strong>
                          <p>{issue.why}</p>
                          <p className="font-medium">{issue.nextStep}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {inputAnalysis.suggestedIdea ? (
                    <div className="grid gap-1 text-sm text-stone-700">
                      <p className="font-semibold text-stone-950">Idea fields inferred</p>
                      {Object.entries(inputAnalysis.suggestedIdea).map(([key, value]) =>
                        value ? (
                          <p key={key}>
                            <span className="font-medium">{key}:</span>{' '}
                            {truncate(String(value), 140)}
                          </p>
                        ) : null,
                      )}
                    </div>
                  ) : null}
                  {inputAnalysis.sources.length ? (
                    <div className="grid gap-2">
                      <p className="text-sm font-semibold text-stone-950">First source guesses</p>
                      {inputAnalysis.sources.slice(0, 3).map((source) => (
                        <div
                          className="border border-stone-200 bg-stone-50 p-2 text-sm"
                          key={source.id}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-stone-950">{source.title}</span>
                            <span className="text-xs text-stone-600">
                              {source.selected ? 'selected' : 'review first'} ·{' '}
                              {source.confidence?.label ?? 'low'}
                            </span>
                          </div>
                          <p className="mt-1 text-stone-600">{source.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <Button
                icon={<Rss className="h-4 w-4" aria-hidden="true" />}
                onClick={commitInference}
                disabled={!inputAnalysis || importState === 'import-committing'}
                variant="secondary"
              >
                Import detected input
              </Button>
              {rssXml ? (
                <Button onClick={cancelImport} variant="ghost">
                  Cancel import
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 content-start">
            {filteredSources.map((source) => (
              <article className="border border-stone-200 bg-white p-4" key={source.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-stone-500">
                      {source.kind}
                      {source.provenance?.shape
                        ? ` · ${source.provenance.shape.replaceAll('_', ' ')}`
                        : ''}
                    </p>
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
                    confidence {source.confidence?.label ?? 'low'} ({source.confidence?.score ?? 0})
                  </span>
                  {source.provenance?.publishedAtIso ? (
                    <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
                      {source.provenance.publishedAtIso.slice(0, 10)}
                    </span>
                  ) : null}
                  {source.provenance?.discussionUrl ? (
                    <a
                      className="border border-stone-200 bg-stone-50 px-2 py-1 text-teal-700"
                      href={source.provenance.discussionUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      discussion
                    </a>
                  ) : null}
                </div>
                {source.issues?.length ? (
                  <div className="mt-3 grid gap-2">
                    {source.issues.map((issue) => (
                      <div
                        className="border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950"
                        key={issue.code}
                      >
                        <strong>{issue.what}</strong>
                        <p>{issue.nextStep}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                {source.reasoning?.length ? (
                  <details className="mt-3 text-sm text-stone-600">
                    <summary className="cursor-pointer font-medium text-stone-800">
                      Why this source looks this way
                    </summary>
                    <ul className="mt-2 grid gap-1">
                      {source.reasoning.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </details>
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
                downloadExport(
                  projectFilename(project.name, 'md'),
                  exports.substack,
                  'text/markdown',
                  'Markdown export',
                )
              }
            >
              Markdown
            </Button>
            <Button
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                downloadExport(
                  projectFilename(project.name, 'json'),
                  exports.projectJson,
                  'application/json',
                  'Project JSON export',
                )
              }
              variant="secondary"
            >
              Project JSON
            </Button>
            <Button
              icon={<Copy className="h-4 w-4" aria-hidden="true" />}
              onClick={copyShareUrl}
              variant="secondary"
            >
              Share URL
            </Button>
            <Button onClick={printCurrentDraft} variant="ghost">
              Print/PDF
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Export formats">
            {exportTabs.map(({ id, label }) => (
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
                onClick={() => setActiveExport(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {shareStatus ? (
            <div className="grid gap-2 border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              <p>{shareStatus}</p>
              {shareUrlPreview ? (
                <input
                  aria-label="Share URL"
                  className={inputClass('font-mono text-xs')}
                  data-testid="share-url-output"
                  readOnly
                  value={shareUrlPreview}
                />
              ) : null}
            </div>
          ) : null}
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

      <Section id="settings" eyebrow="07 Settings" title="Workspace Settings">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="grid content-start gap-3 border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Local LLM</h3>
            <p className="text-sm text-stone-600">
              Uses a browser-reachable Ollama-style endpoint. If CORS or the endpoint blocks the
              request, the app falls back to the deterministic local draft.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={project.llm.enabled}
                type="checkbox"
                onChange={(event) => updateLlm('enabled', event.target.checked)}
              />
              Use local LLM when generating or polishing
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
          <div className="grid content-start gap-3 border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Local Storage</h3>
            <p className="text-sm text-stone-600">
              Projects are stored in this browser. Download Project JSON before clearing local data
              if you want a portable backup.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startFresh} variant="secondary">
                Load demo project
              </Button>
              <Button onClick={startBlankProject} variant="secondary">
                Start blank project
              </Button>
              <Button onClick={clearLocalData} variant="ghost">
                Delete local projects
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {isDebug ? (
        <section className="border-t border-stone-200 bg-stone-100">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 text-sm sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 font-semibold text-stone-950">
              <Info className="h-4 w-4" aria-hidden="true" />
              Debug surface
            </div>
            <pre className="max-h-96 overflow-auto border border-stone-300 bg-white p-4 text-xs leading-5 text-stone-800">
              {JSON.stringify(
                {
                  version: __APP_VERSION__,
                  commit: displayCommit,
                  projectId: project.id,
                  workspaceState,
                  importState,
                  lastInference: inputAnalysis
                    ? {
                        inputKind: inputAnalysis.inputKind,
                        shape: inputAnalysis.shape,
                        confidence: inputAnalysis.confidence,
                        report: inputAnalysis.report,
                        issues: inputAnalysis.issues.map((issue) => issue.code),
                      }
                    : null,
                  cache: inputCacheStats(),
                  activity: (project.activity ?? []).slice(0, 12),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </section>
      ) : null}

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
