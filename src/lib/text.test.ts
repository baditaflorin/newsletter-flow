import { describe, expect, it } from 'vitest'
import { sanitizeUrl } from './text'

describe('sanitizeUrl', () => {
  it('keeps normal http(s) urls untouched', () => {
    expect(sanitizeUrl('https://example.com/article')).toBe('https://example.com/article')
    expect(sanitizeUrl('http://example.com/article')).toBe('http://example.com/article')
  })

  it('keeps relative and empty-ish safe values as-is', () => {
    expect(sanitizeUrl('mailto:writer@example.com')).toBe('mailto:writer@example.com')
    expect(sanitizeUrl('')).toBe('')
    expect(sanitizeUrl(undefined)).toBe('')
    expect(sanitizeUrl(null)).toBe('')
  })

  it('blocks a javascript: URL from a malicious RSS/HTML import or shared project', () => {
    expect(sanitizeUrl('javascript:alert(document.cookie)')).toBe('')
  })

  it('blocks javascript: regardless of case and surrounding whitespace', () => {
    expect(sanitizeUrl('  JavaScript:alert(1)')).toBe('')
    expect(sanitizeUrl('\n\tjavascript:alert(1)')).toBe('')
  })

  it('blocks a javascript: scheme even when split by tabs/newlines, a known filter bypass', () => {
    // Browsers strip TAB/LF/CR from a URL before resolving its scheme, so
    // "java\tscript:alert(1)" still executes as a javascript: URI even
    // though it does not start with the literal string "javascript:".
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('')
    expect(sanitizeUrl('java\nscript:alert(1)')).toBe('')
  })

  it('blocks other script/inline-content schemes', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('')
    expect(sanitizeUrl('file:///etc/passwd')).toBe('')
    expect(sanitizeUrl('blob:https://example.com/uuid')).toBe('')
  })
})
