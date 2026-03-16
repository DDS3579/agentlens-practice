// client/src/hooks/useQuota.js
import { useState, useCallback } from 'react'
import useAuthStore, { ANALYSIS_FREE_LIMIT } from '../store/authStore'

/**
 * Hook for managing analysis quota with ad modal state
 * 
 * @returns {Object} Quota state and actions
 */
function useQuota() {
  // Local state for ad modal visibility
  const [showAdModal, setShowAdModal] = useState(false)

  // Get state and actions from auth store
  const analysesUsed = useAuthStore((state) => state.analysesUsed)
  const isPro = useAuthStore((state) => state.isPro)
  const incrementAnalysis = useAuthStore((state) => state.incrementAnalysis)
  const canRunAnalysis = useAuthStore((state) => state.canRunAnalysis)
  const analysesRemaining = useAuthStore((state) => state.analysesRemaining)
  const grantBonusAnalysis = useAuthStore((state) => state.grantBonusAnalysis)
  const resetQuota = useAuthStore((state) => state.resetQuota)
  const togglePro = useAuthStore((state) => state.togglePro)

  // Computed values
  const canRun = canRunAnalysis()
  const remaining = analysesRemaining()
  const freeLimit = ANALYSIS_FREE_LIMIT

  /**
   * Called after an analysis completes successfully
   * Increments usage and shows ad modal if limit is reached
   */
  const onAnalysisComplete = useCallback(() => {
    incrementAnalysis()
    
    // Check if this was the last free analysis
    // We need to check against FREE_LIMIT - 1 because we just incremented
    const newUsed = useAuthStore.getState().analysesUsed
    const stillCanRun = useAuthStore.getState().canRunAnalysis()
    
    if (!stillCanRun && !useAuthStore.getState().isPro) {
      // User just hit the limit, show ad modal
      setShowAdModal(true)
    }
  }, [incrementAnalysis])

  /**
   * Called when user successfully watches the ad
   * Grants 1 bonus analysis and closes modal
   */
  const onAdWatched = useCallback(() => {
    grantBonusAnalysis()
    setShowAdModal(false)
  }, [grantBonusAnalysis])

  /**
   * Close the ad modal without granting bonus
   */
  const closeAdModal = useCallback(() => {
    setShowAdModal(false)
  }, [])

  /**
   * Open the ad modal manually (e.g., when clicking disabled button)
   */
  const openAdModal = useCallback(() => {
    setShowAdModal(true)
  }, [])

  return {
    // State
    canRun,
    analysesUsed,
    analysesRemaining: remaining,
    freeLimit,
    isPro,
    showAdModal,
    
    // Actions
    setShowAdModal,
    onAnalysisComplete,
    onAdWatched,
    closeAdModal,
    openAdModal,
    
    // Testing helpers
    resetQuota,
    togglePro,
    grantBonusAnalysis,
  }
}

export default useQuota