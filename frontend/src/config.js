export const APP_NAME = 'Image to Prompt AI'

export const ENDPOINT_KEY = 'image_to_prompt_ai_endpoint'
export const HISTORY_KEY = 'image_to_prompt_ai_history'
export const MAX_HISTORY = 50
export const MAX_FILE_SIZE = 20 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

export const AI_MODEL = 'Gemma 3 12B'
export const AI_ENGINE = 'Ollama'
export const AI_GPU = 'NVIDIA T4'

export const COLAB_NOTEBOOK_URL =
  import.meta.env.VITE_COLAB_NOTEBOOK_URL ||
  'https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb'

export function getEndpoint() {
  try {
    return localStorage.getItem(ENDPOINT_KEY) || ''
  } catch {
    return ''
  }
}

export function setEndpoint(url) {
  try {
    const normalized = normalizeEndpoint(url)
    localStorage.setItem(ENDPOINT_KEY, normalized)
    return normalized
  } catch {
    return url
  }
}

export function normalizeEndpoint(url) {
  if (!url) return ''
  let trimmed = url.trim()
  trimmed = trimmed.replace(/\/+$/, '')
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed
  }
  return trimmed
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistoryItem(item) {
  try {
    const history = getHistory()
    history.unshift(item)
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY)
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return history
  } catch {
    return []
  }
}

export function deleteHistoryItem(id) {
  try {
    const history = getHistory().filter(item => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return history
  } catch {
    return []
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
    return []
  } catch {
    return []
  }
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
