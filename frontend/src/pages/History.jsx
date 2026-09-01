import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Copy, Trash2, History as HistoryIcon, Clock, FileImage
} from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { useToast } from '../context/ToastContext'

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function History() {
  const { history, removeItem, clearAll } = useHistory()
  const toast = useToast()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)

  async function handleCopy(item) {
    try {
      await navigator.clipboard.writeText(item.prompt)
      toast.success('Prompt copied to clipboard')
    } catch {
      toast.error('Could not copy prompt.')
    }
  }

  function handleDelete(id) {
    removeItem(id)
    toast.info('Result deleted')
    if (expandedId === id) setExpandedId(null)
  }

  function handleClearAll() {
    clearAll()
    toast.info('History cleared')
    setExpandedId(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-sm text-dark-400 mt-1">
            Your previous generated prompts, stored locally in this browser.
          </p>
        </div>
        {history.length > 0 && (
          <button onClick={handleClearAll} className="btn-ghost text-xs text-rose-400 hover:text-rose-300">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <HistoryIcon className="w-10 h-10 text-dark-600 mx-auto mb-4" />
          <div className="text-sm font-medium text-dark-300 mb-1">No history yet</div>
          <p className="text-xs text-dark-500 mb-4">
            Generate your first prompt to see it here.
          </p>
          <button onClick={() => navigate('/image-to-prompt')} className="btn-primary text-xs">
            <FileImage className="w-3.5 h-3.5" /> Go to Image → Prompt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="glass-card rounded-xl overflow-hidden animate-fade-in">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full text-left p-4 flex items-start gap-3 hover:bg-dark-800/30 transition-colors"
                aria-expanded={expandedId === item.id}
              >
                <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                  <FileImage className="w-4 h-4 text-dark-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-dark-200 truncate">{item.filename}</span>
                    {expandedId === item.id && <Eye className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                  </div>
                  {!expandedId && item.description && (
                    <p className="text-xs text-dark-400 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>

              {expandedId === item.id && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in">
                  {item.description && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Description</div>
                      <p className="text-sm text-dark-300">{item.description}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Prompt</div>
                    <p className="text-sm text-dark-200 bg-dark-800 rounded-lg p-3 whitespace-pre-wrap border border-dark-700/50">{item.prompt}</p>
                  </div>
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-dark-800 border border-dark-700 rounded-full text-[11px] text-dark-300">{kw}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleCopy(item)} className="btn-secondary flex-1 text-xs">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-secondary flex-1 text-xs text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
