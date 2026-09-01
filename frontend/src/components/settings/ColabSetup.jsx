import { ExternalLink, Cloud, Server, Copy, Info, CheckCircle2 } from 'lucide-react'
import { COLAB_NOTEBOOK_URL } from '../../context/ConnectionContext'
import { useToast } from '../../context/ToastContext'

export default function ColabSetup() {
  const toast = useToast()
  const hasColabUrl = Boolean(COLAB_NOTEBOOK_URL)

  const handleOpenNotebook = () => {
    if (!hasColabUrl) {
      toast.error('Colab notebook URL is not configured. Ensure VITE_COLAB_NOTEBOOK_URL is set.')
    }
  }

  const handleCopy = async (value, label) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in">
      <div className="flex items-start gap-3 mb-1">
        <Cloud className="w-5 h-5 text-accent mt-0.5" />
        <div>
          <h2 className="text-base font-bold text-white">Google Colab Backend</h2>
          <p className="text-sm text-dark-400 mt-0.5">
            Open the latest notebook in Google Colab and run the AI server on a free NVIDIA T4 GPU. The
            notebook is version-controlled in GitHub, so this link always loads the current version.
          </p>
        </div>
      </div>

      {!hasColabUrl && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-medium">
            <Info className="w-4 h-4" /> Colab notebook URL is not configured.
          </div>
          <p className="text-xs text-dark-300 leading-relaxed">
            Set the GitHub-based Colab notebook URL in your{' '}
            <code className="text-amber-200">frontend/.env</code> file (or the{' '}
            <strong className="text-dark-200">Frontend Environment Variables</strong> in Vercel) via{' '}
            <code className="text-amber-200">VITE_COLAB_NOTEBOOK_URL</code> (defaults to the
            version-controlled notebook in GitHub). This is the <strong className="text-dark-200">notebook</strong>{' '}
            URL, not the temporary API endpoint.
          </p>
          <button
            onClick={handleOpenNotebook}
            className="btn-secondary text-xs mt-2"
            aria-disabled={true}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Colab Notebook ↗
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0">1</div>
            <div className="w-px flex-1 bg-dark-700" />
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium text-dark-200">Open Colab</div>
            <div className="text-xs text-dark-500 mt-1">
              Open the latest notebook from GitHub. The permanent link always loads the current version from the <code>main</code> branch. It opens in a new tab.
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={hasColabUrl ? COLAB_NOTEBOOK_URL : undefined}
                onClick={hasColabUrl ? undefined : handleOpenNotebook}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs"
                aria-disabled={!hasColabUrl}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Colab Notebook ↗
              </a>
              {hasColabUrl && (
                <button onClick={() => handleCopy(COLAB_NOTEBOOK_URL, 'Notebook URL')} className="btn-secondary text-xs">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0">2</div>
            <div className="w-px flex-1 bg-dark-700" />
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium text-dark-200">Start the server</div>
            <div className="text-xs text-dark-500 mt-1">
              Runtime → Change runtime type → select <strong className="text-dark-200">NVIDIA T4 GPU</strong> → Run All.
              The notebook handles Ollama, Gemma 3 Vision, FastAPI, the Cloudflare Tunnel and the health check automatically.
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0">3</div>
            <div className="w-px flex-1 bg-dark-700" />
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium text-dark-200">Copy your API endpoint</div>
            <div className="text-xs text-dark-500 mt-1">
              Colab shows <strong className="text-dark-200">SERVER READY</strong> and an{' '}
              <strong className="text-accent">API ENDPOINT</strong> like{' '}
              <strong className="text-dark-200">https://xxxxx.trycloudflare.com</strong>. Copy it and paste it
              into the <strong className="text-dark-200">API Endpoint</strong> field below, then click{' '}
              <strong className="text-dark-200">Test Connection</strong>.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-dark-800 rounded-lg p-4 border border-dark-700/50">
        <div className="text-sm font-medium text-white mb-3">Notebook URL vs API Endpoint</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700/50">
            <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1"><CheckCircle2 className="inline w-3 h-3 mr-1" />Colab Notebook</div>
            <div className="text-sm text-dark-200">Version-controlled in GitHub</div>
            <div className="text-xs text-dark-500 mt-1">Always points to the latest notebook from the <code>main</code> branch. Same URL every session.</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-4 border border-accent/30">
            <div className="text-[10px] uppercase tracking-wider text-accent mb-1"><Server className="inline w-3 h-3 mr-1" />API Endpoint</div>
            <div className="text-sm text-dark-200">Temporary runtime URL</div>
            <div className="text-xs text-dark-500 mt-1">New URL each Colab session. Paste it in AI Connection.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
