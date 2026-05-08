import { slugify } from './text'

export function downloadText(filename: string, contents: string, type = 'text/plain') {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function projectFilename(name: string, extension: string) {
  return `${slugify(name)}.${extension}`
}
