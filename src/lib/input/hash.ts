export function stableHash(input: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36).padStart(7, '0')
}

export function stableSourceId(inputHash: string, index: number, title: string, url: string) {
  return `source-${index + 1}-${stableHash(`${inputHash}|${index}|${title}|${url}`).slice(0, 8)}`
}
