export function makeId(prefix: string) {
  const random = crypto.getRandomValues(new Uint32Array(2))
  return `${prefix}_${random[0].toString(36)}${random[1].toString(36)}`
}

export function nowIso() {
  return new Date().toISOString()
}
