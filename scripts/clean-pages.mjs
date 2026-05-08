import { rm } from 'node:fs/promises'

const generated = [
  'docs/404.html',
  'docs/assets',
  'docs/favicon.svg',
  'docs/icons.svg',
  'docs/index.html',
  'docs/manifest.webmanifest',
  'docs/sw.js',
]

await Promise.all(generated.map((path) => rm(path, { force: true, recursive: true })))
