import { describe, expect, it } from 'vitest'
import { parseRssItems } from './rss'

describe('parseRssItems', () => {
  it('parses RSS items into research sources', () => {
    const items = parseRssItems(`<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Local Writing Systems</title>
            <link>https://example.com/local-writing</link>
            <description><![CDATA[<p>A useful note about local workflows.</p>]]></description>
            <pubDate>Fri, 08 May 2026 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: 'rss',
      title: 'Local Writing Systems',
      url: 'https://example.com/local-writing',
      selected: false,
    })
    expect(items[0].summary).toContain('local workflows')
  })
})
