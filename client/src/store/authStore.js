import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  // User plan data from our backend
  userProfile: null,
  isLoadingProfile: false,
  profileError: null,

  // Actions
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
  setProfileError: (profileError) => set({ profileError }),
  clearProfile: () => set({
    userProfile: null,
    isLoadingProfile: false,
    profileError: null,
  }),

  // Computed helpers (derived from userProfile)
  isPro: () => {
    const { userProfile } = get()
    return userProfile?.plan === 'pro'
  },
  canRunAnalysis: () => {
    const { userProfile } = get()
    if (!userProfile) return false
    if (userProfile.plan === 'pro') return true
    return userProfile.analyses_this_month < 5
  },
  analysesRemaining: () => {
    const { userProfile } = get()
    if (!userProfile) return 0
    if (userProfile.plan === 'pro') return Infinity
    return 5 - userProfile.analyses_this_month
  },
}))

export default useAuthStore
