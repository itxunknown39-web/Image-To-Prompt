import { useState } from 'react'
import { X, FileImage, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { formatFileSize } from '../../config'

const STATUS_CONFIG = {
  waiting: { label: 'Ready', icon: Clock, color: 'text-dark-400', dot: 'bg-dark-500' },
  analyzing: { label: 'Analyzing image...', icon: Loader2, color: 'text-accent', dot: 'bg-accent', spin: true },
  generating: { label: 'Generating prompt...', icon: Loader2, color: 'text-accent', dot: 'bg-accent', spin: true },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-rose-400', dot: 'bg-rose-400' },
}

export default function ImageQueueItem({ item, index, onRemove, removable }) {
  const [previewUrl] = useState(() => item.previewUrl)
  const statusKey = item.status || 'waiting'
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.waiting
  const StatusIcon = config.icon

  return (
    <div className="glass-card flex items-center gap-3 p-3 animate-fade-in">
      {previewUrl ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-800 shrink-0">
          <img
            src={previewUrl}
            alt={`Preview of ${item.file.name}`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
          <FileImage className="w-6 h-6 text-dark-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-dark-200 truncate">{item.file.name}</div>
        <div className="text-xs text-dark-500 mt-0.5">{formatFileSize(item.file.size)}</div>
        <div className={`flex items-center gap-1.5 mt-1 text-xs ${config.color}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.spin ? 'animate-spin' : ''}`} />
          <span>{config.label}</span>
        </div>
        {item.error && (
          <div className="mt-1 text-xs text-rose-400 truncate">{item.error}</div>
        )}
      </div>

      {removable && (
        <button
          onClick={() => onRemove(index)}
          className="text-dark-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
          aria-label={`Remove ${item.file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
