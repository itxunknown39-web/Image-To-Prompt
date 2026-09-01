import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getEndpoint, setEndpoint as persistEndpoint, normalizeEndpoint, COLAB_NOTEBOOK_URL } from '../config'
import { checkConnection } from '../services/aiService'

const ConnectionContext = createContext(null)

// Connection health is driven ONLY by GET /health.
// Analysis requests (POST /analyze-image, /analyze-images) NEVER set the
// connection status. While analysis is active we pause automatic health checks
// so a long-running Gemma inference cannot race a /health probe, and we use an
// epoch counter so a stale in-flight health-check result can never overwrite a
// newer connection state.
const HEALTH_REFRESH_MS = 30000
const AFTER_ANALYSIS_DEBOUNCE_MS = 1200

export function ConnectionProvider({ children }) {
  const [endpoint, setEndpointState] = useState('')
  const [status, setStatus] = useState('idle')
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const checkTimer = useRef(null)
  const afterAnalysisTimer = useRef(null)
  const isChecking = useRef(false)
  const analyzingRef = useRef(false)
  const epochRef = useRef(0)
  const testConnectionRef = useRef(null)
  const scheduleRef = useRef(null)

  const clearTimers = useCallback(() => {
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
    if (afterAnalysisTimer.current) {
      clearTimeout(afterAnalysisTimer.current)
      afterAnalysisTimer.current = null
    }
  }, [])

  useEffect(() => {
    const saved = getEndpoint()
    if (saved) {
      setEndpointState(saved)
    }
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const scheduleHealthyRefresh = useCallback(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => {
      checkTimer.current = null
      // Pause/defer periodic health checks while analysis is active.
      if (analyzingRef.current) {
        if (scheduleRef.current) scheduleRef.current()
        return
      }
      const saved = getEndpoint()
      if (saved && testConnectionRef.current) {
        testConnectionRef.current(saved)
      }
    }, HEALTH_REFRESH_MS)
  }, [])
  scheduleRef.current = scheduleHealthyRefresh

  const testConnection = useCallback(async (endpointOverride) => {
    const target = normalizeEndpoint(endpointOverride !== undefined ? endpointOverride : getEndpoint())
    if (!target) {
      setStatus('error')
      setConnectionInfo({ code: 'NO_ENDPOINT', friendly: 'No endpoint configured.' })
      return { connected: false }
    }
    if (isChecking.current) return { connected: false }
    isChecking.current = true
    // Capture an epoch for this specific health check. Only the latest epoch
    // may update connection state, so stale results are always ignored.
    const epoch = ++epochRef.current
    const startedWhileAnalyzing = analyzingRef.current
    if (!startedWhileAnalyzing) {
      setChecking(true)
      setStatus('checking')
    }
    try {
      const info = await checkConnection(target)
      // Ignore this result if a newer source (e.g. analysis start) superseded it.
      if (epoch !== epochRef.current) {
        return { connected: false, stale: true }
      }
      const connectedInfo = { ...info, endpoint: target }
      setConnectionInfo(connectedInfo)
      setStatus('connected')
      setLastChecked(new Date().toISOString())
      if (getEndpoint() === target) {
        scheduleHealthyRefresh()
      }
      return { connected: true, info: connectedInfo }
    } catch (error) {
      if (epoch !== epochRef.current) {
        return { connected: false, stale: true }
      }
      // A transient failure during analysis does not mean the backend is down.
      if (analyzingRef.current) {
        // Do not mark offline; defer a clean health check until analysis ends.
        return { connected: false, deferredWhileAnalyzing: true }
      }
      const info = {
        endpoint: target,
        code: error.code || 'OFFLINE',
        friendly: error.friendly || 'Server is offline.',
      }
      setConnectionInfo(info)
      setStatus('error')
      return { connected: false, error: info }
    } finally {
      isChecking.current = false
      setChecking(false)
    }
  }, [scheduleHealthyRefresh])

  // Always point the timer at the latest testConnection (avoids stale closures).
  testConnectionRef.current = testConnection

  const beginAnalysis = useCallback(() => {
    analyzingRef.current = true
    setAnalyzing(true)
    // Invalidate any in-flight health check so its (stale) result is ignored.
    epochRef.current += 1
    // Pause the periodic refresh so it cannot run during analysis.
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
  }, [])

  const endAnalysis = useCallback(() => {
    analyzingRef.current = false
    setAnalyzing(false)
    // After analysis completes, run ONE health check after a short debounce,
    // then resume periodic refresh from there.
    if (afterAnalysisTimer.current) clearTimeout(afterAnalysisTimer.current)
    afterAnalysisTimer.current = setTimeout(() => {
      afterAnalysisTimer.current = null
      const saved = getEndpoint()
      if (saved && testConnectionRef.current) {
        testConnectionRef.current(saved)
      }
    }, AFTER_ANALYSIS_DEBOUNCE_MS)
  }, [])

  const saveEndpoint = useCallback((url) => {
    clearTimers()
    const normalized = persistEndpoint(url)
    setEndpointState(normalized)
    setStatus('idle')
    setConnectionInfo(null)
    // Restart activity on a clean slate.
    analyzingRef.current = false
    setAnalyzing(false)
    return normalized
  }, [clearTimers])

  return (
    <ConnectionContext.Provider value={{
      endpoint,
      saveEndpoint,
      status,
      connectionInfo,
      testConnection,
      checking,
      lastChecked,
      checkConnection: testConnection,
      analyzing,
      beginAnalysis,
      endAnalysis,
    }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider')
  return ctx
}

export { COLAB_NOTEBOOK_URL }
