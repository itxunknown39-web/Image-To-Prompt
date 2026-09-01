import { useState } from 'react'
import { ExternalLink, Info, CheckCircle2, Copy } from 'lucide-react'
import { COLAB_NOTEBOOK_URL } from '../../context/ConnectionContext'
import { useToast } from '../../context/ToastContext'

const STEPS = [
  {
    title: 'Open the saved Image to Prompt AI Google Colab notebook',
    detail: 'This is your permanent notebook. It stays the same every session.',
    action: COLAB_NOTEBOOK_URL,
    actionLabel: 'Open Colab Notebook ↗',
  },
  {
    title: 'Select Runtime → Change runtime type → NVIDIA T4 GPU',
    detail: 'The T4 GPU is essential for running Gemma 3 12B.',
  },
  {
    title: 'Click Runtime → Run all',
    detail: 'The notebook automatically performs all setup. No manual commands needed.',
  },
  {
    title: 'Wait for "IMAGE TO PROMPT AI SERVER READY"',
    detail: 'The notebook will show a status panel when everything is ready.',
  },
  {
    title: 'Copy the API endpoint',
    detail: 'It looks like https://xxxxx.trycloudflare.com — this is temporary and unique to this session.',
  },
  {
    title: 'Return to Settings → AI Connection',
    detail: 'Paste the URL and click Test Connection.',
  },
]

export default function ColabSetup() {
  const toast = useToast()
  const [showAll, setShowAll] = useState(false)

  const handleCopyNotebook = async () => {
    if (!COLAB_NOTEBOOK_URL) {
      toast.error('Colab notebook URL is not configured. Set VITE_COLAB_NOTEBOOK_URL.')
      return
    }
    try {
      await navigator.clipboard.writeText(COLAB_NOTEBOOK_URL)
      toast.success('Notebook URL copied')
    } catch {
      toast.error('Could not copy URL')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <Info className="w-4 h-4 text-accent" /> HOW TO CONNECT COLAB
        </div>

        <div className={`space-y-4 ${showAll ? '' : ''}`}>
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && <div className="w-px flex-1 bg-dark-700" />}
              </div>
              <div className={`pb-2 ${i < STEPS.length - 1 ? 'border-b border-dark-800' : ''} ${showAll || i < 2 ? '' : 'hidden'}`}>
                <div className="text-sm font-medium text-dark-200">{step.title}</div>
                <div className="text-xs text-dark-500 mt-1">{step.detail}</div>
                {step.action && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={step.action}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn-primary text-xs ${step.action ? '' : 'opacity-50 pointer-events-none'}`}
                      aria-disabled={!step.action}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> {step.actionLabel}
                    </a>
                    {!step.action && (
                      <button onClick={handleCopyNotebook} className="btn-secondary text-xs">
                        <Copy className="w-3.5 h-3.5" /> Copy notebook URL
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="btn-ghost text-xs mt-2"
          >
            Show all steps
          </button>
        )}
      </div>

      <div className="glass-card p-6 rounded-xl">
        <div className="text-sm font-semibold text-white mb-3">Notebook URL vs API Endpoint</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700/50">
            <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Colab Notebook</div>
            <div className="text-sm text-dark-200">Permanent saved notebook</div>
            <div className="text-xs text-dark-500 mt-1">Same URL every session. Configure once in your environment.</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-4 border border-accent/30">
            <div className="text-[10px] uppercase tracking-wider text-accent mb-1">API Endpoint</div>
            <div className="text-sm text-dark-200">Temporary runtime URL</div>
            <div className="text-xs text-dark-500 mt-1">New URL each Colab session. Paste it in AI Connection.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
