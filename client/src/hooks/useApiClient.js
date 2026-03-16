// client/src/hooks/useApiClient.js
import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch, apiFetchJson } from '../lib/apiClient'

/**
 * Hook that provides API client functions with automatic Clerk token injection
 * 
 * @returns {Object} API client methods
 */
export function useApiClient() {
  const { getToken } = useAuth()

  /**
   * Fetch with automatic token and LLM config injection
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<Response>}
   */
  const fetch = useCallback(async (url, options = {}) => {
    const token = await getToken()
    return apiFetch(url, options, token)
  }, [getToken])

  /**
   * Fetch JSON with automatic token and LLM config injection
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<any>}
   */
  const fetchJson = useCallback(async (url, options = {}) => {
    const token = await getToken()
    return apiFetchJson(url, options, token)
  }, [getToken])

  /**
   * POST request helper
   * @param {string} url 
   * @param {Object} body 
   * @param {Object} options 
   * @returns {Promise<any>}
   */
  const post = useCallback(async (url, body, options = {}) => {
    const token = await getToken()
    return apiFetchJson(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }, token)
  }, [getToken])

  /**
   * GET request helper
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<any>}
   */
  const get = useCallback(async (url, options = {}) => {
    const token = await getToken()
    return apiFetchJson(url, {
      method: 'GET',
      ...options,
    }, token)
  }, [getToken])

  /**
   * PUT request helper
   * @param {string} url 
   * @param {Object} body 
   * @param {Object} options 
   * @returns {Promise<any>}
   */
  const put = useCallback(async (url, body, options = {}) => {
    const token = await getToken()
    return apiFetchJson(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }, token)
  }, [getToken])

  /**
   * DELETE request helper
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<any>}
   */
  const del = useCallback(async (url, options = {}) => {
    const token = await getToken()
    return apiFetchJson(url, {
      method: 'DELETE',
      ...options,
    }, token)
  }, [getToken])

  /**
   * Get current LLM config from store (for display purposes)
   */
  const getLLMHeaders = useCallback(() => {
    const { getLLMConfig } = require('../store/authStore').default.getState()
    return getLLMConfig()
  }, [])

  return {
    fetch,
    fetchJson,
    post,
    get,
    put,
    del,
    getLLMHeaders,
    getToken,
  }
}

export default useApiClient