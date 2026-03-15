
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore.js'

function useAuth() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { isSignedIn, isLoaded: isAuthLoaded, getToken } = useClerkAuth()

  const userProfile = useAuthStore((state) => state.userProfile)
  const usageStats = useAuthStore((state) => state.usageStats)
  const isLoadingProfile = useAuthStore((state) => state.isLoadingProfile)
  const setUserProfile = useAuthStore((state) => state.setUserProfile)
  const setUsageStats = useAuthStore((state) => state.setUsageStats)
  const setLoadingProfile = useAuthStore((state) => state.setLoadingProfile)
  const setProfileError = useAuthStore((state) => state.setProfileError)
  const clearProfile = useAuthStore((state) => state.clearProfile)
  const isPro = useAuthStore((state) => state.isPro)
  const canRunAnalysis = useAuthStore((state) => state.canRunAnalysis)
  const analysesRemaining = useAuthStore((state) => state.analysesRemaining)

  const isLoaded = isUserLoaded && isAuthLoaded

  useEffect(() => {
    async function fetchUserProfile() {
      if (!isLoaded) return

      if (!isSignedIn || !user?.id) {
        clearProfile()
        return
      }

      try {
        setLoadingProfile(true)
        setProfileError(null)

        const token = await getToken()
        const response = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }

        const data = await response.json()
        setUserProfile(data.user)

        // Fetch usage stats after successful profile fetch
        try {
          const statsRes = await fetch('/api/user/usage/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setUsageStats(statsData)
          }
        } catch (statsError) {
          console.error('Failed to fetch usage stats:', statsError)
          // Stats fetch failure should not affect profile fetch
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setProfileError(error.message)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [isLoaded, isSignedIn, user?.id])

  const refreshProfile = async () => {
    if (!isSignedIn || !user?.id) return

    try {
      const token = await getToken()
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)

        // Also refresh usage stats
        try {
          const statsRes = await fetch('/api/user/usage/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setUsageStats(statsData)
          }
        } catch (statsError) {
          console.error('Failed to fetch usage stats:', statsError)
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  return {
    // From Clerk
    isSignedIn,
    isLoaded,
    user,
    getToken,

    // From our backend (via authStore)
    userProfile,
    usageStats,
    isPro: isPro(),
    canRunAnalysis: canRunAnalysis(),
    analysesRemaining: analysesRemaining(),
    isLoadingProfile,
    refreshProfile,
  }
}

export default useAuth