import { useState, useCallback } from 'react'
import { getHistory, saveHistoryItem, deleteHistoryItem, clearHistory, generateId } from '../config'

export function useHistory() {
  const [history, setHistory] = useState(() => getHistory())

  const addItem = useCallback((data) => {
    const item = {
      id: generateId(),
      filename: data.filename || 'image.jpg',
      timestamp: new Date().toISOString(),
      description: data.description || '',
      prompt: data.prompt || '',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    }
    const next = saveHistoryItem(item)
    setHistory(next)
    return item
  }, [])

  const removeItem = useCallback((id) => {
    const next = deleteHistoryItem(id)
    setHistory(next)
  }, [])

  const clearAll = useCallback(() => {
    const next = clearHistory()
    setHistory(next)
  }, [])

  return { history, addItem, removeItem, clearAll }
}
