// client/src/lib/apiClient.js
import useAuthStore from '../store/authStore'

/**
 * Base API fetch function that injects LLM config headers
 * Note: This is NOT a hook - it's a plain function that requires token to be passed
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} token - Clerk auth token
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}, token = null) {
  // Get LLM config from store
  const state = useAuthStore.getState()
  const llmConfig = state.getLLMConfig()
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Add LLM config headers if configured and this is an API request
  if (url.startsWith('/api') || url.includes('/api/')) {
    if (llmConfig.provider) {
      headers['x-llm-provider'] = llmConfig.provider
    }
    
    if (llmConfig.model) {
      headers['x-llm-model'] = llmConfig.model
    }
    
    // Only send API key for providers that need it (not Ollama)
    if (llmConfig.provider !== 'ollama' && llmConfig.apiKey) {
      headers['x-llm-api-key'] = llmConfig.apiKey
    }
    
    // Send base URL for Ollama
    if (llmConfig.provider === 'ollama' && llmConfig.baseUrl) {
      headers['x-llm-base-url'] = llmConfig.baseUrl
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Convenience function for JSON responses
 * @param {string} url 
 * @param {Object} options 
 * @param {string} token 
 * @returns {Promise<any>}
 */
export async function apiFetchJson(url, options = {}, token = null) {
  const response = await apiFetch(url, options, token)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }
  
  return response.json()
}

export default apiFetch