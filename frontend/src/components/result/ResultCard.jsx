import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, RefreshCw, Download, ChevronDown, ChevronRight, Tags, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatFileSize } from '../../config'
import { useToast } from '../../context/ToastContext'

export default function ResultCard({ result, onRedo, redoDisabled }) {
  const file = result.file
  const data = result.data
  const toast = useToast()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!file || previewUrl) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file, previewUrl])

  const handleCopy = useCallback(async () => {
    if (!data?.prompt) return
    try {
      await navigator.clipboard.writeText(data.prompt)
      setCopied(true)
      toast.success('Prompt copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the text and copy manually.')
    }
  }, [data, toast])

  const handleDownload = useCallback(() => {
    if (!data?.prompt) return
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const content = data.prompt
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}-prompt.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Prompt downloaded')
  }, [data, file, toast])

  const handleJsonDownload = useCallback(() => {
    if (!data) return
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('JSON downloaded')
  }, [data, file, toast])

  if (!data) {
    return (
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-dark-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-dark-200">{file.name}</div>
            <div className="text-xs text-dark-500">{formatFileSize(file.size)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400" />
          <span className="text-rose-400">{result.error || 'Analysis failed.'}</span>
        </div>
        {onRedo && (
          <button onClick={() => onRedo(file)} disabled={redoDisabled} className="btn-secondary w-full">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden rounded-xl animate-fade-in">
      <div className="w-full h-52 sm:h-64 bg-dark-950 overflow-hidden relative">
        {previewUrl && (
          <img src={previewUrl} alt={`Result preview of ${file.name}`} className="w-full h-full object-contain" />
        )}
        <div className="absolute top-3 left-3 glass-card px-3 py-1.5 rounded-lg flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-xs text-dark-300 truncate max-w-[160px]">{file.name}</span>
          <span className="text-[10px] text-dark-500">{formatFileSize(file.size)}</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-dark-500">
          <span className="px-2 py-1 bg-dark-800 rounded-md">Gemma 3 12B</span>
          <span className="px-2 py-1 bg-dark-800 rounded-md">Ollama</span>
          <span className="px-2 py-1 bg-dark-800 rounded-md">T4</span>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-dark-500 mb-2">Generated Prompt</div>
          <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap">{data.prompt}</p>
        </div>

        <div className="border-t border-dark-800 pt-4">
          <button
            onClick={() => setDescriptionOpen(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400 hover:text-dark-200"
            aria-expanded={descriptionOpen}
          >
            {descriptionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Description
          </button>
          {descriptionOpen && (
            <p className="mt-2 text-sm text-dark-300">{data.description}</p>
          )}
        </div>

        {data.keywords && data.keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-500 mb-2">
              <Tags className="w-3.5 h-3.5" /> Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.keywords.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 bg-dark-800 border border-dark-700 rounded-full text-xs text-dark-300">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button onClick={handleCopy} className="btn-primary flex-1">
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {onRedo && (
            <button onClick={() => onRedo(file)} disabled={redoDisabled} className="btn-secondary flex-1">
              <RefreshCw className="w-4 h-4" /> Redo
            </button>
          )}
          <button onClick={handleDownload} className="btn-secondary flex-1">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleJsonDownload}
            className="text-xs text-dark-500 hover:text-dark-300 transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Download JSON
          </button>
        </div>
      </div>
    </div>
  )
}
