import { useNavigate } from 'react-router-dom'
import { ImageIcon, History, Settings as SettingsIcon, ArrowRight, Sparkles } from 'lucide-react'
import { useConnection } from '../context/ConnectionContext'
import { AI_MODEL, AI_GPU, AI_ENGINE } from '../config'

export default function Dashboard() {
  const navigate = useNavigate()
  const { status } = useConnection()
  const connected = status === 'connected'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <section className="text-center pt-8 sm:pt-14">
        <div className="inline-flex items-center gap-2 mb-4 glass-card px-4 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-dark-300">Gemma 3 Vision</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          Image to <span className="text-gradient">Prompt</span> AI
        </h1>
        <p className="mt-4 text-base sm:text-lg text-dark-400 max-w-xl mx-auto">
          Transform any image into a professional AI-ready prompt.
        </p>

        <div className="mt-8">
          <button onClick={() => navigate('/image-to-prompt')} className="btn-primary px-8 py-3.5 text-base">
            <ImageIcon className="w-5 h-5" /> Upload Image
          </button>
        </div>
      </section>

      <div className="border-t border-dark-800 my-8" />

      <section className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-dark-500">AI Status</span>
          <span className={`flex items-center gap-2 text-sm font-medium ${connected ? 'text-emerald-400' : 'text-dark-400'}`}>
            <span className={`status-dot ${connected ? 'status-connected' : 'status-offline'}`} />
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-dark-800 rounded-lg p-3 text-center border border-dark-700/50">
            <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Model</div>
            <div className="text-sm font-medium text-white">{AI_MODEL}</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-3 text-center border border-dark-700/50">
            <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">GPU</div>
            <div className="text-sm font-medium text-white">{AI_GPU}</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-3 text-center border border-dark-700/50">
            <div className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Engine</div>
            <div className="text-sm font-medium text-white">{AI_ENGINE}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/image-to-prompt', label: 'Image → Prompt', desc: 'Generate prompts from images', icon: ImageIcon },
          { to: '/history', label: 'View History', desc: 'Browse past generations', icon: History },
          { to: '/settings', label: 'AI Settings', desc: 'Configure your server', icon: SettingsIcon },
        ].map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="glass-card-hover p-5 text-left group"
          >
            <item.icon className="w-5 h-5 text-accent mb-3" />
            <div className="text-sm font-medium text-dark-200 flex items-center gap-1.5">
              {item.label}
              <ArrowRight className="w-3.5 h-3.5 text-dark-500 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-xs text-dark-500 mt-1">{item.desc}</div>
          </button>
        ))}
      </section>

      {!connected && (
        <div className="glass-card p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-amber-500/20">
          <div className="text-sm text-dark-300">
            <span className="font-medium text-amber-400">AI server is offline.</span>{' '}
            Connect your Colab server from Settings to start generating prompts.
          </div>
          <button onClick={() => navigate('/settings')} className="btn-secondary shrink-0 text-xs">
            <SettingsIcon className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      )}
    </div>
  )
}
