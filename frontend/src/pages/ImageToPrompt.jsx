import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Loader2, Settings as SettingsIcon,
  AlertCircle, Trash2
} from 'lucide-react'
import UploadZone from '../components/upload/UploadZone'
import ImageQueueItem from '../components/upload/ImageQueueItem'
import ResultCard from '../components/result/ResultCard'
import { useConnection } from '../context/ConnectionContext'
import { useToast } from '../context/ToastContext'
import { useHistory } from '../hooks/useHistory'
import { analyzeImage } from '../services/aiService'
import { generateId } from '../config'

export default function ImageToPrompt() {
  const { status, endpoint, beginAnalysis, endAnalysis } = useConnection()
  const toast = useToast()
  const { addItem } = useHistory()
  const navigate = useNavigate()

  const connected = status === 'connected'
  const needsEndpoint = connected === false && !endpoint

  const [items, setItems] = useState([])
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const createFileId = useCallback((file) => {
    return `${file.name}-${file.size}-${file.lastModified}`
  }, [])

  const handleAddFiles = useCallback((validFiles, errors) => {
    if (errors && errors.length) {
      for (const err of errors) {
        toast.error(`${err.filename}: ${err.error}`)
      }
    }
    if (!validFiles.length) return

    const existing = new Set(items.map(i => createFileId(i.file)))
    const newItems = validFiles
      .filter(f => !existing.has(createFileId(f)))
      .map(file => ({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'waiting',
        error: null,
      }))

    if (!newItems.length) {
      toast.info('Those images are already in the queue.')
      return
    }

    setItems(prev => [...prev, ...newItems])
    toast.success(`${newItems.length} image${newItems.length > 1 ? 's' : ''} added`)
  }, [items, createFileId, toast])

  const handleRemove = useCallback((index) => {
    setItems(prev => {
      const next = [...prev]
      const removed = next[index]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      next.splice(index, 1)
      return next
    })
  }, [])

  const clearQueue = useCallback(() => {
    items.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl))
    setItems([])
  }, [items])

  const updateItemStatus = useCallback((idOrIndex, updates) => {
    setItems(prev => prev.map((item, i) => {
      const isMatch = typeof idOrIndex === 'number' ? i === idOrIndex : item.id === idOrIndex
      return isMatch ? { ...item, ...updates } : item
    }))
  }, [])

  const handleGenerate = useCallback(async (targetFiles) => {
    const filesToProcess = targetFiles || items.map(i => i.file)
    const targetIndexes = targetFiles
      ? filesToProcess.map(f => {
          const idx = items.findIndex(i => i.file === f)
          return idx
        }).filter(i => i >= 0)
      : items.map((_, i) => i)

    if (!filesToProcess.length) {
      toast.error('Add at least one image first.')
      return
    }

    setProcessing(true)
    setTotalCount(filesToProcess.length)
    setCurrentIndex(0)
    setProgress(`Processing 1 of ${filesToProcess.length}`)
    beginAnalysis()

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        const idx = targetIndexes[i]
        setCurrentIndex(i + 1)
        setProgress(`Processing ${i + 1} of ${filesToProcess.length}: ${file.name}`)

        if (idx !== undefined) updateItemStatus(idx, { status: 'analyzing', error: null })

        try {
          const data = await analyzeImage(file)
          if (idx !== undefined) updateItemStatus(idx, { status: 'completed', error: null })

          const result = { id: generateId(), file, data }
          setResults(prev => [result, ...prev])

          addItem({
            filename: file.name,
            description: data.description,
            prompt: data.prompt,
            keywords: data.keywords,
          })
        } catch (error) {
          if (idx !== undefined) updateItemStatus(idx, { status: 'failed', error: error.friendly || 'Analysis failed.' })
          const result = { id: generateId(), file, data: null, error: error.friendly || 'Analysis failed.' }
          setResults(prev => [result, ...prev])
          toast.error(error.friendly || 'Analysis failed')
        }
      }
      setProgress('')
    } finally {
      endAnalysis()
      setProcessing(false)
      setProgress('')
    }
  }, [items, updateItemStatus, addItem, toast, beginAnalysis, endAnalysis])

  const handleRedo = useCallback((file) => {
    handleGenerate([file])
  }, [handleGenerate])

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-white">Image → Prompt</h1>
        <p className="text-sm text-dark-400 mt-1">
          Upload an image and generate a detailed, professional AI image-generation prompt.
        </p>
      </header>

      {!connected && (
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 text-left glass-card p-4 rounded-xl border-amber-500/20 hover:border-amber-500/40 transition-colors"
          aria-label="Go to settings"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-amber-400">
              {needsEndpoint ? 'AI endpoint not configured.' : 'Colab AI server is offline.'}
            </span>
            <p className="text-xs text-dark-400">Go to Settings → AI Connection to set up your server.</p>
          </div>
          <SettingsIcon className="w-4 h-4 text-dark-500 ml-auto shrink-0" />
        </button>
      )}

      <UploadZone
        disabled={processing}
        onAddFiles={handleAddFiles}
      />

      {items.length > 0 && (
        <section className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-400">
              Selected Images
            </h2>
            <div className="flex items-center gap-3">
              {processing && progress && (
                <span className="text-xs text-accent flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {progress}
                </span>
              )}
              <button onClick={clearQueue} disabled={processing} className="btn-ghost text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <ImageQueueItem
                key={item.id}
                item={item}
                index={index}
                onRemove={handleRemove}
                removable={!processing}
              />
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => handleGenerate()}
            disabled={processing || !connected}
            className="btn-primary flex-1 py-3 text-base"
          >
            {processing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Prompt</>
            )}
          </button>
        </div>
      )}

      {!items.length && !processing && (
        <div className="text-center py-6 text-dark-500 text-sm">
          No images selected yet. Drop images above to get started.
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-400">
              Results
            </h2>
            <span className="text-xs text-dark-500">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
          {results.map(result => (
            <ResultCard
              key={result.id}
              result={result}
              onRedo={connected ? handleRedo : undefined}
              redoDisabled={processing}
            />
          ))}
        </section>
      )}
    </div>
  )
}
