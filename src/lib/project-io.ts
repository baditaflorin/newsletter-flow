import type { NewsletterProject } from '../types'
import { makePlatformExports } from './generator'
import { parseProjectPayload, projectToJson } from './project-schema'

const sharePrefix = '#project='
const maxShareUrlLength = 12000

function encodeBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function decodeBase64Url(input: string) {
  const padded = input
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function makeProjectStateJson(project: NewsletterProject) {
  return projectToJson(project, makePlatformExports(project).metadata)
}

export function parseProjectStateJson(payload: string) {
  return parseProjectPayload(payload)
}

export function makeProjectShareUrl(project: NewsletterProject, baseUrl: string) {
  const state = encodeBase64Url(makeProjectStateJson(project))
  const url = `${baseUrl.split('#')[0]}${sharePrefix}${state}`
  return {
    url,
    tooLarge: url.length > maxShareUrlLength,
    bytes: new Blob([url]).size,
    maxBytes: maxShareUrlLength,
  }
}

export function parseProjectShareHash(hash: string) {
  if (!hash.startsWith(sharePrefix)) return undefined
  return parseProjectStateJson(decodeBase64Url(hash.slice(sharePrefix.length)))
}
