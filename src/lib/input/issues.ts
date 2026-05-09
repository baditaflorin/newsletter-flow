import type { DomainIssue, IssueSeverity } from '../../types'

export function issue(
  code: string,
  severity: IssueSeverity,
  what: string,
  why: string,
  nextStep: string,
): DomainIssue {
  return { code, severity, what, why, nextStep }
}

export const issues = {
  emptyInput: () =>
    issue(
      'EMPTY_INPUT',
      'recoverable',
      'No source text was provided.',
      'The research importer needs a brief, feed, article, URL, OPML subscription list, or pasted text.',
      'Paste source material or add a source manually.',
    ),
  importCapped: (found: number, imported: number) =>
    issue(
      'IMPORT_CAPPED',
      'warning',
      `${found} feed items were found and ${imported} were imported.`,
      'The app caps a single import so one noisy feed does not overwhelm the draft.',
      'Review the imported items first, then import the remaining feed items in a separate pass if needed.',
    ),
  opmlUrlsOnly: () =>
    issue(
      'OPML_FEED_URLS_ONLY',
      'warning',
      'This is a subscription list, not article evidence.',
      'OPML contains feed URLs. It usually does not include the article text needed for a newsletter draft.',
      'Import feed URLs as source candidates, then paste or fetch the articles you want to cite.',
    ),
  urlOnly: () =>
    issue(
      'URL_ONLY_NO_CONTENT',
      'warning',
      'Only a URL was provided.',
      'The browser cannot reliably extract article text from arbitrary sites because of CORS and page structure.',
      'Paste the article text or HTML so the source can become evidence.',
    ),
  truncated: () =>
    issue(
      'TRUNCATED_INPUT',
      'recoverable',
      'The feed appears to end before the XML is complete.',
      'This usually happens when a copy/paste or transfer stopped in the middle of a feed item.',
      'Recovered complete items are safe to review; paste the full feed again if items are missing.',
    ),
  metadataHeavy: () =>
    issue(
      'METADATA_HEAVY_SOURCE',
      'warning',
      'This source mostly contains metadata.',
      'Aggregator feeds often include titles and links but little article evidence.',
      'Open the original article and paste the relevant excerpt before using it in a draft.',
    ),
  malformed: () =>
    issue(
      'MALFORMED_INPUT',
      'recoverable',
      'The source input is not cleanly parseable.',
      'It may be partial XML, broken HTML, or content pasted from the wrong place.',
      'Review the recovered preview, or paste a cleaner copy of the source.',
    ),
  lowContent: () =>
    issue(
      'LOW_CONTENT_CONFIDENCE',
      'warning',
      'This source has little usable evidence.',
      'A title or URL alone is not enough to support a newsletter claim.',
      'Add a summary or article excerpt before selecting it for the draft.',
    ),
}
