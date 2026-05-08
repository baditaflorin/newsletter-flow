export interface LocalLlmRequest {
  endpoint: string
  model: string
  prompt: string
}

function endpointUrl(endpoint: string) {
  const trimmed = endpoint.replace(/\/$/, '')
  return trimmed.endsWith('/api/generate') ? trimmed : `${trimmed}/api/generate`
}

export async function requestLocalLlm({ endpoint, model, prompt }: LocalLlmRequest) {
  const response = await fetch(endpointUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Local LLM returned ${response.status}`)
  }

  const payload = (await response.json()) as { response?: string; error?: string }
  if (payload.error) throw new Error(payload.error)
  if (!payload.response) throw new Error('Local LLM returned an empty response')

  return payload.response.trim()
}
