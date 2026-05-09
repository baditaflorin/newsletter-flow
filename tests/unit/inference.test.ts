import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDefaultProject } from '../../src/lib/demo'
import { analyzeNewsletterInput } from '../../src/lib/input/inference'

const fixtureDir = 'test/fixtures/realdata'

interface ExpectedContract {
  fixtureId: string
  expect: {
    inputKind?: string
    shape?: string
    minSources?: number
    selectedCount?: number
    minConfidence?: number
    tagsInclude?: string[]
    warningsInclude?: string[]
    warningsIncludeAny?: string[]
    ideaFields?: string[]
    titleIncludes?: string
    importReport?: {
      found?: number
      imported?: number
      skipped?: number
      mustDiscloseFoundImportedSkipped?: boolean
    }
    mustNotCreateEmptySelectedSource?: boolean
    extractVersionSignals?: boolean
    preservesCodeSignals?: boolean
    preserveDiscussionUrl?: boolean
    recoverPartial?: boolean
    errorSeverity?: string
  }
}

const expectedFiles: string[] = readdirSync(fixtureDir)
  .filter((file) => file.endsWith('.expected.json'))
  .sort()

function inputPathFor(expectedPath: string) {
  const base = expectedPath.replace('.expected.json', '')
  return readdirSync(fixtureDir)
    .filter((file) => file.startsWith(base) && !file.endsWith('.expected.json'))
    .map((file) => join(fixtureDir, file))[0]
}

function deterministicSubset(input: string) {
  const result = analyzeNewsletterInput(input, createDefaultProject())
  return JSON.stringify({
    inputKind: result.inputKind,
    shape: result.shape,
    confidence: result.confidence,
    sourceIds: result.sources.map((source) => source.id),
    selected: result.sources.map((source) => source.selected),
    issueCodes: result.issues.map((issue) => issue.code),
    suggestedIdea: result.suggestedIdea,
  })
}

describe('real-data substance fixtures', () => {
  it.each(expectedFiles.map((expectedFile) => [expectedFile] as const))(
    'satisfies %s',
    (expectedFile) => {
      const expected = JSON.parse(
        readFileSync(join(fixtureDir, expectedFile), 'utf8'),
      ) as ExpectedContract
      const input = readFileSync(inputPathFor(expectedFile), 'utf8')
      const result = analyzeNewsletterInput(input, createDefaultProject())
      const contract = expected.expect

      if (contract.inputKind) expect(result.inputKind).toBe(contract.inputKind)
      if (contract.shape) expect(result.shape).toBe(contract.shape)
      if (contract.minSources)
        expect(result.sources.length).toBeGreaterThanOrEqual(contract.minSources)
      if (contract.selectedCount !== undefined) {
        expect(result.sources.filter((source) => source.selected)).toHaveLength(
          contract.selectedCount,
        )
      }
      if (contract.minConfidence)
        expect(result.confidence.score).toBeGreaterThanOrEqual(contract.minConfidence)
      if (contract.importReport?.found !== undefined)
        expect(result.report.found).toBe(contract.importReport.found)
      if (contract.importReport?.imported !== undefined) {
        expect(result.report.imported).toBe(contract.importReport.imported)
      }
      if (contract.importReport?.skipped !== undefined)
        expect(result.report.skipped).toBe(contract.importReport.skipped)
      if (contract.importReport?.mustDiscloseFoundImportedSkipped) {
        expect(result.report).toEqual(
          expect.objectContaining({
            found: expect.any(Number),
            imported: expect.any(Number),
            skipped: expect.any(Number),
          }),
        )
      }

      const warningCodes = [
        ...result.issues.map((issue) => issue.code),
        ...result.sources.flatMap((source) => source.issues?.map((issue) => issue.code) ?? []),
      ]
      for (const code of contract.warningsInclude ?? []) expect(warningCodes).toContain(code)
      if (contract.warningsIncludeAny?.length) {
        expect(warningCodes.some((code) => contract.warningsIncludeAny?.includes(code))).toBe(true)
      }

      const tags = new Set(result.sources.flatMap((source) => source.tags))
      for (const tag of contract.tagsInclude ?? []) expect(tags).toContain(tag)

      if (contract.ideaFields) {
        for (const field of contract.ideaFields) {
          expect(result.suggestedIdea?.[field as keyof typeof result.suggestedIdea]).toBeTruthy()
        }
      }
      if (contract.titleIncludes) {
        expect(
          result.sources.some((source) =>
            source.title.toLowerCase().includes(contract.titleIncludes!.toLowerCase()),
          ),
        ).toBe(true)
      }
      if (contract.extractVersionSignals) {
        expect(
          result.sources.some((source) => /v?\d+\.\d+/.test(`${source.title} ${source.content}`)),
        ).toBe(true)
      }
      if (contract.preservesCodeSignals) {
        expect(result.sources.some((source) => /code|CODE_BLOCK/i.test(source.content))).toBe(true)
      }
      if (contract.preserveDiscussionUrl) {
        expect(result.sources.some((source) => source.provenance?.discussionUrl)).toBe(true)
      }
      if (contract.recoverPartial) expect(result.sources.length).toBeGreaterThan(0)
      if (contract.errorSeverity) {
        expect(result.issues.some((issue) => issue.severity === contract.errorSeverity)).toBe(true)
      }
      if (contract.mustNotCreateEmptySelectedSource) {
        expect(
          result.sources.some(
            (source) =>
              source.selected &&
              !source.title.trim() &&
              !source.content.trim() &&
              !source.summary.trim(),
          ),
        ).toBe(false)
      }
    },
  )

  it('is deterministic across repeated fixture runs', () => {
    for (const expectedFile of expectedFiles) {
      const input = readFileSync(inputPathFor(expectedFile), 'utf8')
      const outputs = new Set(Array.from({ length: 5 }, () => deterministicSubset(input)))
      expect(outputs.size).toBe(1)
    }
  })

  it('does not crash on synthetic edge cases', () => {
    const edgeCases = [
      '',
      '\uFEFFTitle\r\nBody with\u00a0NBSP and smart quotes “here”.',
      '<rss><channel><item><title>Broken',
      '<article><h1>Broken HTML<p>Still usable',
      Array.from({ length: 10 }, () =>
        readFileSync(join(fixtureDir, '02-nasa-news-rss.xml'), 'utf8'),
      ).join('\n'),
    ]

    for (const input of edgeCases) {
      expect(() => analyzeNewsletterInput(input, createDefaultProject())).not.toThrow()
    }
  })
})
