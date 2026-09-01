import { createContext, useContext, useCallback, useRef, useState } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeouts = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id])
      delete timeouts.current[id]
    }
  }, [])

  const show = useCallback((message, type = 'info', options = {}) => {
    const id = ++idCounter
    const toast = { id, message, type, duration: options.duration || 3500 }
    setToasts(prev => [...prev, toast])
    timeouts.current[id] = setTimeout(() => dismiss(id), toast.duration)
    return id
  }, [dismiss])

  const success = useCallback((msg, opts) => show(msg, 'success', opts), [show])
  const error = useCallback((msg, opts) => show(msg, 'error', opts), [show])
  const info = useCallback((msg, opts) => show(msg, 'info', opts), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }) {
  const icons = {
    success: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
    error: <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>,
    info: <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  }

  return (
    <div role="region" aria-label="Notifications" className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="glass-card animate-slide-in-right flex items-start gap-3 px-4 py-3 shadow-xl border"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {icons[toast.type] || icons.info}
          <p className="text-sm text-dark-200 flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-dark-500 hover:text-dark-300 transition-colors -m-1 p-1"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
