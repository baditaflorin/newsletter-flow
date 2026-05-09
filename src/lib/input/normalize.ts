const entityMap: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

export function normalizeRawInput(input: string) {
  return input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\u2060]/g, '')
    .trim()
}

export function decodeEntities(input: string) {
  return input
    .replace(/&([a-z]+);/gi, (_, key: string) => entityMap[key.toLowerCase()] ?? `&${key};`)
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCharCode(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCharCode(parseInt(value, 16)))
}

export function normalizeWhitespace(input: string) {
  return decodeEntities(input)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeTag(input: string) {
  return (
    normalizeWhitespace(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'source'
  )
}

export function stripMarkup(input: string) {
  return normalizeWhitespace(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<pre[\s\S]*?<\/pre>/gi, (match) => ` CODE_BLOCK ${match} CODE_BLOCK `)
      .replace(/<[^>]+>/g, ' '),
  )
}

export function normalizeDate(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed)) return ''
  const date = new Date(parsed)
  const year = date.getUTCFullYear()
  if (year < 1995 || year > 2100) return ''
  return date.toISOString()
}

export function absoluteUrl(url: string, baseUrl = '') {
  const trimmed = decodeEntities(url).trim()
  if (!trimmed) return ''
  try {
    return new URL(trimmed, baseUrl || undefined).toString()
  } catch {
    return trimmed
  }
}
