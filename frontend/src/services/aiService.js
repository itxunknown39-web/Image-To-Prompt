import { getEndpoint, normalizeEndpoint } from '../config'

const TIMEOUT_MS = 60000

function timeoutSignal(ms = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { controller, timer }
}

function apiUrl(path) {
  const endpoint = normalizeEndpoint(getEndpoint())
  if (!endpoint) throw new Error('no_endpoint')
  return endpoint + path
}

function getErrorMessage(error) {
  if (error && error.message === 'no_endpoint') {
    return {
      code: 'NO_ENDPOINT',
      friendly: 'AI endpoint not configured.',
      detail: 'Go to Settings → AI Connection to configure your server.',
    }
  }
  if (error && error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      friendly: 'The AI server took too long to respond.',
      detail: 'Please try again.',
    }
  }
  if (error && error.message) {
    return {
      code: 'UNKNOWN',
      friendly: 'Server could not be reached.',
      detail: error.message,
    }
  }
  return {
    code: 'UNKNOWN',
    friendly: 'An unexpected error occurred.',
    detail: '',
  }
}

export async function checkConnection(endpointOverride) {
  const endpoint = normalizeEndpoint(endpointOverride !== undefined ? endpointOverride : getEndpoint())
  if (!endpoint) {
    throw {
      code: 'NO_ENDPOINT',
      friendly: 'AI endpoint not configured.',
      detail: 'Go to Settings → AI Connection to configure your server.',
    }
  }

  const { controller, timer } = timeoutSignal()
  try {
    const res = await fetch(endpoint + '/health', {
      method: 'GET',
      signal: controller.signal,
      headers: { 'X-Requested-With': 'image-to-prompt-ai' },
    })
    if (!res.ok) {
      throw { code: 'HTTP', status: res.status, friendly: `Server responded with HTTP ${res.status}.` }
    }
    const data = await res.json()
    return {
      connected: true,
      status: data.status,
      service: data.service,
      ollama: !!data.ollama,
      model: data.model,
      vision: !!data.vision,
    }
  } catch (error) {
    if (error && error.code) throw error
    const friendly = (error && error.message === 'Failed to fetch') || (error && error.name === 'TypeError')
      ? 'Server is offline.'
      : getErrorMessage(error).friendly
    throw {
      code: 'OFFLINE',
      friendly,
      detail: 'Open the Colab notebook and ensure the server is running.',
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function analyzeImage(file, onStatus) {
  const endpoint = normalizeEndpoint(getEndpoint())
  if (!endpoint) throw getErrorMessage({ message: 'no_endpoint' })

  const formData = new FormData()
  formData.append('file', file)

  const { controller, timer } = timeoutSignal(TIMEOUT_MS * 2)
  try {
    const res = await fetch(endpoint + '/analyze-image', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: { 'X-Requested-With': 'image-to-prompt-ai' },
    })

    let data
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok) {
      const detail = data && data.error ? data.error : `Server error (HTTP ${res.status}).`
      throw { code: 'HTTP', friendly: detail, detail }
    }

    if (!data || data.success === false) {
      const detail = (data && data.error) || 'Vision model failed to analyze the image.'
      throw { code: 'MODEL', friendly: detail, detail }
    }

    return {
      success: true,
      description: data.description || '',
      prompt: data.prompt || '',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    }
  } catch (error) {
    if (error && error.code) throw error
    const msg = getErrorMessage(error)
    throw msg
  } finally {
    clearTimeout(timer)
  }
}

export async function analyzeImages(files, onProgress) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length, 'analyzing')
    try {
      const result = await analyzeImage(files[i])
      results.push({ file: files[i], result, error: null })
    } catch (error) {
      results.push({ file: files[i], result: null, error: error.friendly || 'Failed to analyze.' })
    }
    if (onProgress) onProgress(i + 1, files.length, 'done')
  }
  return results
}
