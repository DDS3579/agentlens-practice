
import { Router } from 'express'
import { requireAuth, syncUser } from '../middleware/auth.js'
import { attachUser, requirePro } from '../middleware/planCheck.js'
import { getUserById, updateUser, deleteUser, upsertApiKey, getUserApiKeys } from '../db/userService.js'
import { supabase } from '../db/supabase.js'
import { callOpenAIWithKey } from '../llm/openaiProvider.js'
import { callAnthropicWithKey } from '../llm/anthropicProvider.js'
import { encrypt, decrypt } from '../utils/Encryption.js'

const router = Router()

// All routes use requireAuth + syncUser middleware
router.use(requireAuth, syncUser)

// ============================================
// PROFILE ROUTES
// ============================================

// GET /user/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserById(req.auth.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

// PUT /user/profile - Update current user profile
router.put('/profile', async (req, res) => {
  try {
    const { display_name, avatar_url } = req.body
    const updatedUser = await updateUser(req.auth.userId, {
      display_name,
      avatar_url
    })
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return res.status(500).json({ error: 'Failed to update user profile' })
  }
})

// DELETE /user/profile - Delete current user account
router.delete('/profile', async (req, res) => {
  try {
    const deleted = await deleteUser(req.auth.userId)
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ message: 'User account deleted successfully' })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return res.status(500).json({ error: 'Failed to delete user account' })
  }
})

// ============================================
// PLAN & USAGE ROUTES
// ============================================

// GET /user/plan/status - Get current plan info for the user
router.get('/plan/status', async (req, res) => {
  try {
    const user = await getUserById(req.auth.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const isPro = user.plan === 'pro'
    const limit = isPro ? null : 5
    const remaining = isPro ? null : Math.max(0, 5 - (user.analyses_this_month || 0))
    
    return res.json({
      plan: user.plan || 'free',
      analysesThisMonth: user.analyses_this_month || 0,
      monthResetDate: user.month_reset_date,
      limit,
      remaining,
      isPro
    })
  } catch (error) {
    console.error('Error fetching plan status:', error)
    return res.status(500).json({ error: 'Failed to fetch plan status' })
  }
})

// GET /user/usage/stats - Get aggregated usage stats for the user
router.get('/usage/stats', async (req, res) => {
  try {
    const userId = req.auth.userId

    // Get total analyses count
    const { count: totalAnalyses, error: countError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      throw countError
    }

    // Get stats data for calculations
    const { data: statsData, error: statsError } = await supabase
      .from('analyses')
      .select('bug_count, duration_ms, created_at')
      .eq('user_id', userId)

    if (statsError) {
      throw statsError
    }

    // Calculate totals
    const totalBugs = statsData.reduce((sum, row) => sum + (row.bug_count || 0), 0)
    const avgDuration = statsData.length > 0
      ? Math.round(statsData.reduce((sum, row) => sum + (row.duration_ms || 0), 0) / statsData.length)
      : 0

    // Get analyses this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const analysesThisMonth = statsData.filter(row => 
      new Date(row.created_at) >= startOfMonth
    ).length

    return res.json({
      totalAnalyses: totalAnalyses || 0,
      totalBugs,
      analysesThisMonth,
      avgDuration,
      avgBugsPerAnalysis: totalAnalyses > 0 ? Math.round(totalBugs / totalAnalyses * 10) / 10 : 0
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return res.status(500).json({ error: 'Failed to fetch usage stats' })
  }
})

// POST /user/plan/request-upgrade - Log an upgrade request
router.post('/plan/request-upgrade', async (req, res) => {
  try {
    const { email, message } = req.body
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    
    console.log(`[UPGRADE REQUEST] User ${req.auth.userId} (${req.auth.email}) wants Pro`)
    console.log(`  Contact Email: ${email}`)
    console.log(`  Message: ${message || 'No message provided'}`)
    console.log(`  Timestamp: ${new Date().toISOString()}`)
    
    return res.json({
      success: true,
      message: 'Upgrade request received. We will contact you shortly.'
    })
  } catch (error) {
    console.error('Error processing upgrade request:', error)
    return res.status(500).json({ error: 'Failed to process upgrade request' })
  }
})

// ============================================
// LLM CONFIGURATION ROUTES
// ============================================

// GET /user/llm/keys - Returns user's saved LLM configs (masked keys)
router.get('/llm/keys', async (req, res) => {
  try {
    const keys = await getUserApiKeys(req.auth.userId)
    
    // Mask API keys for security - only show last 4 characters
    const maskedKeys = keys.map(key => ({
      id: key.id,
      provider: key.provider,
      model_name: key.model_name,
      ollama_url: key.ollama_url,
      has_key: !!key.encrypted_key,
      masked_key: key.encrypted_key 
        ? '••••••••' + decrypt(key.encrypted_key).slice(-4) 
        : null,
      created_at: key.created_at,
      updated_at: key.updated_at
    }))
    
    return res.json({ keys: maskedKeys })
  } catch (error) {
    console.error('Error fetching LLM keys:', error)
    return res.status(500).json({ error: 'Failed to fetch LLM keys' })
  }
})

// GET /user/llm/active - Get currently active LLM provider
router.get('/llm/active', async (req, res) => {
  try {
    const keys = await getUserApiKeys(req.auth.userId)
    const user = await getUserById(req.auth.userId)
    
    // Find the active provider (could be stored in user preferences or just return all configured)
    const configuredProviders = keys.map(k => k.provider)
    
    return res.json({
      configuredProviders,
      activeProvider: user?.active_llm_provider || configuredProviders[0] || 'groq',
      hasCustomConfig: keys.length > 0
    })
  } catch (error) {
    console.error('Error fetching active LLM:', error)
    return res.status(500).json({ error: 'Failed to fetch active LLM configuration' })
  }
})

// POST /user/llm/save - Saves LLM configuration
router.post('/llm/save', attachUser, async (req, res) => {
  try {
    const { provider, config } = req.body
    const userId = req.auth.userId
    
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' })
    }
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Config object is required' })
    }
    
    // Valid providers
    const validProviders = ['groq', 'openai', 'anthropic', 'ollama']
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` })
    }
    
    // Check Pro requirement for openai and anthropic
    const proOnlyProviders = ['openai', 'anthropic']
    if (proOnlyProviders.includes(provider) && !req.user?.is_pro) {
      return res.status(403).json({ 
        error: 'Pro subscription required for this provider',
        upgrade_required: true,
        provider
      })
    }
    
    let saveData = { provider }
    
    if (provider === 'ollama') {
      // Ollama uses URL and model name, no API key
      if (!config.ollamaUrl) {
        return res.status(400).json({ error: 'Ollama URL is required' })
      }
      saveData.ollama_url = config.ollamaUrl.replace(/\/$/, '') // Remove trailing slash
      saveData.model_name = config.modelName || 'llama3'
      saveData.encrypted_key = null
    } else {
      // groq, openai, anthropic use API keys
      if (!config.apiKey) {
        return res.status(400).json({ error: 'API key is required for this provider' })
      }
      
      // Basic key format validation
      if (config.apiKey.length < 20) {
        return res.status(400).json({ error: 'API key appears to be invalid (too short)' })
      }
      
      saveData.encrypted_key = encrypt(config.apiKey)
      saveData.model_name = config.modelName || null
      saveData.ollama_url = null
    }
    
    await upsertApiKey(userId, saveData)
    
    return res.json({ 
      success: true, 
      message: `${provider} configuration saved successfully`,
      provider
    })
  } catch (error) {
    console.error('Error saving LLM config:', error)
    return res.status(500).json({ error: 'Failed to save LLM configuration' })
  }
})

// DELETE /user/llm/:provider - Delete a saved LLM configuration
router.delete('/llm/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const userId = req.auth.userId
    
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)
    
    if (error) {
      throw error
    }
    
    return res.json({ 
      success: true, 
      message: `${provider} configuration removed` 
    })
  } catch (error) {
    console.error('Error deleting LLM config:', error)
    return res.status(500).json({ error: 'Failed to delete LLM configuration' })
  }
})

// POST /user/llm/test - Tests LLM connection without saving
router.post('/llm/test', async (req, res) => {
  try {
    const { provider, config } = req.body
    
    if (!provider) {
      return res.json({ success: false, error: 'Provider is required' })
    }
    
    if (!config || typeof config !== 'object') {
      return res.json({ success: false, error: 'Config object is required' })
    }
    
    const testPrompt = 'Respond with only the word "OK" to confirm the connection works.'
    
    switch (provider) {
      case 'ollama': {
        if (!config.ollamaUrl) {
          return res.json({ success: false, error: 'Ollama URL is required' })
        }
        
        try {
          const baseUrl = config.ollamaUrl.replace(/\/$/, '')
          
          // First check if Ollama is reachable
          const tagsResponse = await fetch(`${baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(10000)
          })
          
          if (!tagsResponse.ok) {
            return res.json({ 
              success: false, 
              error: `Ollama returned status ${tagsResponse.status}` 
            })
          }
          
          const tagsData = await tagsResponse.json()
          const availableModels = tagsData.models?.map(m => m.name) || []
          
          // Check if the requested model is available
          const modelName = config.modelName || 'llama3'
          const modelAvailable = availableModels.some(m => 
            m.includes(modelName) || modelName.includes(m.split(':')[0])
          )
          
          return res.json({ 
            success: true, 
            message: 'Ollama connection successful',
            availableModels: availableModels.slice(0, 10),
            modelAvailable,
            requestedModel: modelName
          })
        } catch (error) {
          const errorMessage = error.name === 'TimeoutError' 
            ? 'Connection timed out - is Ollama running?' 
            : error.message
          return res.json({ 
            success: false, 
            error: `Failed to connect to Ollama: ${errorMessage}` 
          })
        }
      }
      
      case 'groq': {
        if (!config.apiKey) {
          return res.json({ success: false, error: 'API key is required' })
        }
        
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.modelName || 'llama3-8b-8192',
              messages: [{ role: 'user', content: testPrompt }],
              max_tokens: 10,
              temperature: 0
            }),
            signal: AbortSignal.timeout(15000)
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.choices && data.choices.length > 0) {
              return res.json({ 
                success: true, 
                message: 'Groq connection successful',
                model: data.model,
                response: data.choices[0]?.message?.content
              })
            }
          }
          
          const errorData = await response.json().catch(() => ({}))
          return res.json({ 
            success: false, 
            error: errorData.error?.message || `Groq API returned status ${response.status}` 
          })
        } catch (error) {
          const errorMessage = error.name === 'TimeoutError' 
            ? 'Request timed out' 
            : error.message
          return res.json({ 
            success: false, 
            error: `Failed to connect to Groq: ${errorMessage}` 
          })
        }
      }
      
      case 'openai': {
        if (!config.apiKey) {
          return res.json({ success: false, error: 'API key is required' })
        }
        
        try {
          const response = await callOpenAIWithKey(config.apiKey, testPrompt, {
            model: config.modelName || 'gpt-3.5-turbo',
            maxTokens: 10
          })
          
          if (response) {
            return res.json({ 
              success: true, 
              message: 'OpenAI connection successful',
              response: response.substring(0, 50)
            })
          }
          return res.json({ 
            success: false, 
            error: 'OpenAI API test failed - no response received' 
          })
        } catch (error) {
          return res.json({ 
            success: false, 
            error: `Failed to connect to OpenAI: ${error.message}` 
          })
        }
      }
      
      case 'anthropic': {
        if (!config.apiKey) {
          return res.json({ success: false, error: 'API key is required' })
        }
        
        try {
          const response = await callAnthropicWithKey(config.apiKey, testPrompt, {
            model: config.modelName || 'claude-3-haiku-20240307',
            maxTokens: 10
          })
          
          if (response) {
            return res.json({ 
              success: true, 
              message: 'Anthropic connection successful',
              response: response.substring(0, 50)
            })
          }
          return res.json({ 
            success: false, 
            error: 'Anthropic API test failed - no response received' 
          })
        } catch (error) {
          return res.json({ 
            success: false, 
            error: `Failed to connect to Anthropic: ${error.message}` 
          })
        }
      }
      
      default:
        return res.json({ 
          success: false, 
          error: `Unknown provider: ${provider}. Valid providers: groq, openai, anthropic, ollama` 
        })
    }
  } catch (error) {
    console.error('Error testing LLM connection:', error)
    return res.json({ 
      success: false, 
      error: `Test failed unexpectedly: ${error.message}` 
    })
  }
})

export default router
