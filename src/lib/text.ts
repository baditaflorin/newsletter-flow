const htmlEntityMap: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

export function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+);/gi, (_, key: string) => htmlEntityMap[key.toLowerCase()] ?? ' ')
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCharCode(Number(value)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function sentenceSplit(input: string) {
  return input
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function wordTokens(input: string) {
  return (
    input
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9'-]*/g)
      ?.filter((word) => word.length > 2) ?? []
  )
}

export function truncate(input: string, maxLength: number) {
  if (input.length <= maxLength) return input
  return `${input.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'newsletter-flow'
  )
}

// Matches URL schemes that execute code or load inline content when
// navigated to, rather than just linking to a document (javascript:, data:,
// vbscript:, file:, blob:).
const unsafeUrlSchemePattern = /^(javascript|data|vbscript|file|blob):/i

/**
 * Returns `url` unchanged if it is safe to place in an href/src attribute,
 * otherwise returns an empty string.
 *
 * `source.url` and `source.provenance.discussionUrl` can originate from
 * untrusted input: a pasted RSS/Atom/HTML/OPML feed, a manually typed field,
 * or an imported/shared Project JSON payload (including one loaded
 * automatically from a `#project=` share-URL hash). None of those paths are
 * guaranteed to produce an http(s) URL, so a crafted source with
 * `url: "javascript:...”` would otherwise render as a clickable link that
 * executes arbitrary script in the app's origin - with access to the
 * IndexedDB store holding every local project - when clicked.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  // Browsers strip all TAB/LF/CR characters from a URL before resolving its
  // scheme, so the safety check has to do the same or a payload such as
  // "java\tscript:alert(1)" would slip past a plain prefix test while still
  // executing when clicked.
  const withoutLineBreaksAndTabs = trimmed.replace(/[\t\n\r]+/g, '')
  return unsafeUrlSchemePattern.test(withoutLineBreaksAndTabs) ? '' : trimmed
}
