import { XMLParser } from 'fast-xml-parser'
import type { ResearchSource } from '../types'
import { makeId } from './ids'
import { stripHtml, truncate } from './text'

type RssNode = Record<string, unknown>

const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
})

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function readString(node: RssNode, keys: string[]) {
  for (const key of keys) {
    const value = node[key]
    if (typeof value === 'string' && value.trim()) return stripHtml(value)
    if (typeof value === 'number') return String(value)
    if (value && typeof value === 'object') {
      const nested = value as RssNode
      if (typeof nested['#text'] === 'string') return stripHtml(nested['#text'])
      if (typeof nested.href === 'string') return nested.href
    }
  }
  return ''
}

function readLink(node: RssNode) {
  const direct = readString(node, ['link', 'guid'])
  if (direct) return direct

  const links = asArray(node.link as RssNode | RssNode[] | undefined)
  const alternate = links.find((link) => link.rel === 'alternate') ?? links[0]
  return alternate && typeof alternate.href === 'string' ? alternate.href : ''
}

function fromItem(item: RssNode): ResearchSource {
  const title = readString(item, ['title']) || 'Untitled RSS item'
  const content = readString(item, ['content:encoded', 'content', 'summary', 'description'])
  const summary = truncate(readString(item, ['description', 'summary']) || content, 220)

  return {
    id: makeId('source'),
    kind: 'rss',
    title,
    url: readLink(item),
    author: readString(item, ['dc:creator', 'author', 'creator']),
    publishedAt: readString(item, ['pubDate', 'published', 'updated']),
    summary,
    content,
    tags: ['rss'],
    selected: true,
  }
}

export function parseRssItems(xml: string): ResearchSource[] {
  const parsed = parser.parse(xml) as RssNode
  const rss = parsed.rss as RssNode | undefined
  const channel = rss?.channel as RssNode | undefined
  const feed = parsed.feed as RssNode | undefined

  const rssItems = asArray(channel?.item as RssNode | RssNode[] | undefined)
  const atomItems = asArray(feed?.entry as RssNode | RssNode[] | undefined)
  const items = rssItems.length ? rssItems : atomItems

  return items.map(fromItem).filter((source) => source.title || source.content)
}
