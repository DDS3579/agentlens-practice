
import { useState, useCallback, useRef, useMemo } from 'react'
import useAuth from './useAuth.js'

const CACHE_TTL = 60000 // 60 seconds

export function useAnalysisHistory() {
  const [analyses, setAnalyses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()
  const cacheRef = useRef({ data: null, timestamp: null })

  const fetchHistory = useCallback(async () => {
    // Check cache
    const now = Date.now()
    if (cacheRef.current.data && (now - cacheRef.current.timestamp) < CACHE_TTL) {
      setAnalyses(cacheRef.current.data)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = await getToken()
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        // Server error — degrade gracefully instead of blocking UI
        console.warn(`[History] API returned ${res.status}, showing empty state`)
        setAnalyses([])
        // Only show error for non-500 errors (500 = likely DB not configured yet)
        if (res.status !== 500) {
          setError('Failed to fetch history')
        }
        return
      }

      const data = await res.json()
      const analysesData = data.analyses || []
      
      setAnalyses(analysesData)
      cacheRef.current = { data: analysesData, timestamp: Date.now() }
    } catch (err) {
      // Network error or token error — degrade gracefully
      console.warn('[History] Fetch failed:', err.message)
      setAnalyses([])
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  const refreshHistory = useCallback(async () => {
    // Bypass cache
    cacheRef.current = { data: null, timestamp: null }
    
    setIsLoading(true)
    setError(null)

    try {
      const token = await getToken()
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await res.json()
      const analysesData = data.analyses || []
      
      setAnalyses(analysesData)
      cacheRef.current = { data: analysesData, timestamp: Date.now() }
    } catch (err) {
      setError(err.message || 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  const deleteAnalysis = useCallback(async (id) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to delete analysis')
      }

      // Update local state
      setAnalyses(prev => {
        const updated = prev.filter(a => a.id !== id)
        // Update cache
        cacheRef.current = { data: updated, timestamp: Date.now() }
        return updated
      })
    } catch (err) {
      setError(err.message || 'Failed to delete analysis')
    }
  }, [getToken])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Computed values
  const totalBugsFound = useMemo(() => {
    return analyses.reduce((sum, a) => sum + (a.bug_count || 0), 0)
  }, [analyses])

  const totalAnalyses = analyses.length

  const avgDuration = useMemo(() => {
    if (analyses.length === 0) return 0
    const total = analyses.reduce((sum, a) => sum + (a.duration_ms || 0), 0)
    return Math.round(total / analyses.length)
  }, [analyses])

  return {
    analyses,
    isLoading,
    error,
    fetchHistory,
    deleteAnalysis,
    refreshHistory,
    clearError,
    totalBugsFound,
    totalAnalyses,
    avgDuration
  }
}
