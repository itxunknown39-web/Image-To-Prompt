import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getEndpoint, setEndpoint as persistEndpoint, normalizeEndpoint, COLAB_NOTEBOOK_URL } from '../config'
import { checkConnection } from '../services/aiService'

const ConnectionContext = createContext(null)

export function ConnectionProvider({ children }) {
  const [endpoint, setEndpointState] = useState('')
  const [status, setStatus] = useState('idle')
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const checkTimer = useRef(null)
  const isChecking = useRef(false)

  useEffect(() => {
    const saved = getEndpoint()
    if (saved) {
      setEndpointState(saved)
    }
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current)
    }
  }, [])

  const saveEndpoint = useCallback((url) => {
    const normalized = persistEndpoint(url)
    setEndpointState(normalized)
    setStatus('idle')
    setConnectionInfo(null)
    if (normalized && checkTimer.current) {
      clearTimeout(checkTimer.current)
    }
    return normalized
  }, [])

  const testConnection = useCallback(async (endpointOverride) => {
    const target = normalizeEndpoint(endpointOverride !== undefined ? endpointOverride : getEndpoint())
    if (!target) {
      setStatus('error')
      setConnectionInfo({ code: 'NO_ENDPOINT', friendly: 'No endpoint configured.' })
      return { connected: false }
    }
    if (isChecking.current) return { connected: false }
    isChecking.current = true
    setChecking(true)
    setStatus('checking')
    try {
      const info = await checkConnection(target)
      const connectedInfo = { ...info, endpoint: target }
      setConnectionInfo(connectedInfo)
      setStatus('connected')
      setLastChecked(new Date().toISOString())
      if (getEndpoint() === target) {
        scheduleHealthyRefresh()
      }
      return { connected: true, info: connectedInfo }
    } catch (error) {
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
  }, [])

  const scheduleHealthyRefresh = useCallback(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => {
      const saved = getEndpoint()
      if (saved) {
        testConnection(saved)
      }
    }, 30000)
  }, [testConnection])

  return (
    <ConnectionContext.Provider value={{
      endpoint,
      saveEndpoint,
      status,
      setStatus,
      connectionInfo,
      testConnection,
      checking,
      lastChecked,
      checkConnection: testConnection,
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
