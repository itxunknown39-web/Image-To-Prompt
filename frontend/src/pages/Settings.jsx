import { useState } from 'react'
import ConnectionSettings from '../components/settings/ConnectionSettings'
import ColabSetup from '../components/settings/ColabSetup'
import Preferences from '../components/settings/Preferences'

export default function Settings() {
  const [tab, setTab] = useState('connection')

  const tabs = [
    { id: 'connection', label: 'AI Connection' },
    { id: 'colab', label: 'Colab Setup' },
    { id: 'preferences', label: 'Preferences' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-dark-400 mt-1">
          Configure your AI server connection and Colab setup.
        </p>
      </header>

      <div className="flex gap-1 border-b border-dark-800 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
              ${tab === t.id
                ? 'border-accent text-white'
                : 'border-transparent text-dark-400 hover:text-dark-200'}`}
            aria-selected={tab === t.id}
            role="tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'connection' && <ConnectionSettings />}
      {tab === 'colab' && <ColabSetup />}
      {tab === 'preferences' && <Preferences />}

      <div className="glass-card p-5 rounded-xl border-dark-800">
        <div className="text-sm font-medium text-dark-200 mb-2">Personal-Use Note</div>
        <p className="text-xs text-dark-400 leading-relaxed space-y-2">
          This application uses a temporary Google Colab runtime and a Cloudflare Quick Tunnel.
          <br /><br />
          • Colab runtime may disconnect after idle periods.
          <br />• T4 GPU availability may vary.
          <br />• The temporary endpoint changes whenever a new Colab session starts.
          <br />• AI generation only works while Colab is running.
          <br />• The website itself remains online at all times on Vercel.
        </p>
      </div>
    </div>
  )
}
