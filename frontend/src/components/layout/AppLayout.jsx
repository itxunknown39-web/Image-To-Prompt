import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ImageIcon, History, Settings as SettingsIcon, Sparkles, Menu, X, Zap } from 'lucide-react'
import { APP_NAME } from '../../config'
import { useConnection } from '../../context/ConnectionContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/image-to-prompt', label: 'Image → Prompt', icon: ImageIcon, end: false },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

export default function AppLayout({ children }) {
  const { status } = useConnection()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const connected = status === 'connected'

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col lg:flex-row">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          connected={connected}
        />

        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-medium text-dark-400">
            <span>CORE PROMISE</span>
            <span className="text-dark-600">—</span>
            <span>Upload an image → Get a professional AI prompt</span>
          </div>
          <ConnectionBadge connected={connected} />
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto pb-24 lg:pb-8">
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  )
}

function Sidebar({ open, onClose }) {
  const { status } = useConnection()
  const connected = status === 'connected'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-0 h-full lg:h-screen w-64 flex flex-col
          bg-dark-900 border-r border-dark-800 z-50 lg:z-30
          transition-transform duration-300 lg:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/15 border border-accent/30">
            <Sparkles className="w-4.5 h-4.5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white leading-tight">{APP_NAME}</div>
            <div className="text-[10px] text-dark-500 mt-0.5">AI Image → Prompt</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-dark-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 flex-1 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-dark-500">Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
              }
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-dark-800 space-y-3">
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-dark-500">AI Status</span>
              <span className={`status-dot ${connected ? 'status-connected' : 'status-offline'}`} />
            </div>
            <div className="text-xs text-dark-300">
              {connected ? '● Connected' : '● Offline'}
            </div>
          </div>
          <div className="flex items-center gap-2 px-1 text-[10px] text-dark-600">
            <Zap className="w-3 h-3" />
            Gemma 3 12B • Ollama • T4
          </div>
        </div>
      </aside>
    </>
  )
}

function MobileHeader({ onOpenSidebar, connected }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-dark-800 bg-dark-900/90 backdrop-blur-sm">
      <button
        onClick={onOpenSidebar}
        className="text-dark-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-800"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="w-4 h-4 text-accent" />
        Image to Prompt AI
      </div>
      <ConnectionBadge connected={connected} compact />
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-sm border-t border-dark-800 flex">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
            ${isActive ? 'text-accent' : 'text-dark-500 hover:text-dark-300'}`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="truncate max-w-full px-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function ConnectionBadge({ connected, compact }) {
  return (
    <NavLink
      to="/settings"
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
        ${connected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200'}`}
      aria-label={connected ? 'AI connected - go to settings' : 'AI offline - go to settings'}
    >
      <span className={`status-dot ${connected ? 'status-connected' : 'status-offline'}`} />
      {!compact && <span>{connected ? 'Connected' : 'Offline'}</span>}
    </NavLink>
  )
}
