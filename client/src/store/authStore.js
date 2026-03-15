// client/src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Constants
const FREE_LIMIT = 5
const QUOTA_STORAGE_KEY = 'agentlens-quota'

// ============================================
// NEW: LLM Provider Constants & Defaults
// ============================================
const DEFAULT_LLM_PROVIDER = 'groq'
const DEFAULT_LLM_MODEL = 'llama3-8b-8192'

// Available models per provider (free tier)
export const PROVIDER_MODELS = {
  groq: [
    { value: 'llama3-8b-8192', label: 'LLaMA 3 8B', description: 'Fast & capable' },
    { value: 'llama3-70b-8192', label: 'LLaMA 3 70B', description: 'Most capable' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', description: 'Good for code' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B', description: 'Efficient' },
  ],
  ollama: [], // Freetext input
  openai: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Free tier only' },
  ],
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // EXISTING STATE - User plan data from backend
      // ============================================
      userProfile: null,
      usageStats: null,
      isLoadingProfile: false,
      profileError: null,

      // ============================================
      // EXISTING STATE - Local quota tracking for hackathon
      // ============================================
      analysesUsed: 0,
      isPro: false,

      // ============================================
      // NEW STATE - LLM Provider Configuration
      // ============================================
      llmProvider: DEFAULT_LLM_PROVIDER,
      llmApiKey: '', // Stored as btoa() encoded for basic obfuscation
      llmModel: DEFAULT_LLM_MODEL,
      llmBaseUrl: 'http://localhost:11434', // For Ollama

      // ============================================
      // EXISTING ACTIONS
      // ============================================
      setUserProfile: (profile) => set({ userProfile: profile }),
      setUsageStats: (usageStats) => set({ usageStats }),
      setLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
      setProfileError: (profileError) => set({ profileError }),
      clearProfile: () => set({
        userProfile: null,
        usageStats: null,
        isLoadingProfile: false,
        profileError: null,
      }),

      // ============================================
      // EXISTING ACTIONS - Quota management
      // ============================================
      incrementAnalysis: () => {
        const { analysesUsed, isPro } = get()
        if (!isPro) {
          set({ analysesUsed: Math.min(analysesUsed + 1, FREE_LIMIT) })
        }
      },
      resetQuota: () => set({ analysesUsed: 0 }),
      grantBonusAnalysis: () => {
        set({ analysesUsed: FREE_LIMIT - 1 })
      },
      togglePro: () => {
        const { isPro } = get()
        set({ isPro: !isPro })
      },
      setIsPro: (isPro) => set({ isPro }),

      // ============================================
      // NEW ACTIONS - LLM Configuration
      // ============================================
      
      /**
       * Set LLM configuration
       * @param {Object} config - Configuration object
       * @param {string} config.provider - Provider: 'groq' | 'ollama' | 'openai'
       * @param {string} [config.apiKey] - API key (will be btoa encoded)
       * @param {string} [config.model] - Model name
       * @param {string} [config.baseUrl] - Base URL (for Ollama)
       */
      setLLMConfig: ({ provider, apiKey, model, baseUrl }) => {
        const updates = {}
        
        if (provider !== undefined) {
          updates.llmProvider = provider
        }
        
        if (apiKey !== undefined) {
          // Encode API key with btoa for basic obfuscation in localStorage
          // Note: This is NOT encryption, just obfuscation for hackathon
          try {
            updates.llmApiKey = apiKey ? btoa(apiKey) : ''
          } catch (e) {
            console.error('Failed to encode API key:', e)
            updates.llmApiKey = ''
          }
        }
        
        if (model !== undefined) {
          updates.llmModel = model
        }
        
        if (baseUrl !== undefined) {
          updates.llmBaseUrl = baseUrl
        }
        
        set(updates)
      },

      /**
       * Clear LLM configuration to defaults
       */
      clearLLMConfig: () => set({
        llmProvider: DEFAULT_LLM_PROVIDER,
        llmApiKey: '',
        llmModel: DEFAULT_LLM_MODEL,
        llmBaseUrl: 'http://localhost:11434',
      }),

      /**
       * Get decoded API key
       * @returns {string} Decoded API key or empty string
       */
      getDecodedApiKey: () => {
        const { llmApiKey } = get()
        if (!llmApiKey) return ''
        try {
          return atob(llmApiKey)
        } catch (e) {
          console.error('Failed to decode API key:', e)
          return ''
        }
      },

      /**
       * Get full LLM config for API requests
       * @returns {Object} Config object with decoded API key
       */
      getLLMConfig: () => {
        const { llmProvider, llmApiKey, llmModel, llmBaseUrl } = get()
        return {
          provider: llmProvider,
          apiKey: llmApiKey ? (() => {
            try {
              return atob(llmApiKey)
            } catch {
              return ''
            }
          })() : '',
          model: llmModel,
          baseUrl: llmBaseUrl,
        }
      },

      // ============================================
      // EXISTING COMPUTED HELPERS
      // ============================================
      getIsPro: () => {
        const { isPro } = get()
        return isPro
      },
      canRunAnalysis: () => {
        const { isPro, analysesUsed } = get()
        if (isPro) return true
        return analysesUsed < FREE_LIMIT
      },
      analysesRemaining: () => {
        const { isPro, analysesUsed } = get()
        if (isPro) return Infinity
        return Math.max(0, FREE_LIMIT - analysesUsed)
      },
      getFreeLimit: () => FREE_LIMIT,
    }),
    {
      name: QUOTA_STORAGE_KEY,
      // Persist quota and LLM config fields
      partialize: (state) => ({
        analysesUsed: state.analysesUsed,
        isPro: state.isPro,
        llmProvider: state.llmProvider,
        llmApiKey: state.llmApiKey,
        llmModel: state.llmModel,
        llmBaseUrl: state.llmBaseUrl,
      }),
    }
  )
)

export const ANALYSIS_FREE_LIMIT = FREE_LIMIT
export default useAuthStore