import { SlidersHorizontal } from 'lucide-react'

export default function Preferences() {
  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-semibold text-white mb-6">
        <SlidersHorizontal className="w-4 h-4 text-accent" /> PREFERENCES
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-dark-200">Connection Auto-Refresh</div>
            <div className="text-xs text-dark-500 mt-0.5">
              The app periodically re-checks your AI connection while online.
            </div>
          </div>
          <span className="text-xs text-dark-500 whitespace-nowrap">Always on</span>
        </div>

        <div className="border-t border-dark-800 pt-4">
          <div className="text-sm font-medium text-dark-200">Default AI Model</div>
          <div className="text-xs text-dark-500 mt-0.5">Configured on the Colab backend.</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-xs text-accent font-medium">
              Gemma 3 12B (default)
            </span>
            <span className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-full text-xs text-dark-400">
              Gemma 3 4B (fallback)
            </span>
          </div>
        </div>

        <div className="border-t border-dark-800 pt-4">
          <div className="text-sm font-medium text-dark-200">Local History</div>
          <div className="text-xs text-dark-500 mt-0.5">
            Up to 50 results are stored in your browser's localStorage. No cloud storage.
          </div>
        </div>

        <div className="border-t border-dark-800 pt-4">
          <div className="text-sm font-medium text-dark-200">Supported Images</div>
          <div className="text-xs text-dark-500 mt-0.5">
            JPG, PNG, WEBP, AVIF. Maximum 20 MB per image.
          </div>
        </div>
      </div>
    </div>
  )
}
