import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore.js'

function useAuth() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { isSignedIn, isLoaded: isAuthLoaded, getToken } = useClerkAuth()

  const userProfile = useAuthStore((state) => state.userProfile)
  const isLoadingProfile = useAuthStore((state) => state.isLoadingProfile)
  const setUserProfile = useAuthStore((state) => state.setUserProfile)
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
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setProfileError(error.message)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [isLoaded, isSignedIn, user?.id])

  return {
    // From Clerk
    isSignedIn,
    isLoaded,
    user,
    getToken,

    // From our backend (via authStore)
    userProfile,
    isPro: isPro(),
    canRunAnalysis: canRunAnalysis(),
    analysesRemaining: analysesRemaining(),
    isLoadingProfile,
  }
}

export default useAuth
