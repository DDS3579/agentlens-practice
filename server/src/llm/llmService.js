// server/src/llm/llmService.js

import { callGroq, callGroqWithKey, testGroqConnection } from './groqProvider.js';
import { callOllama, isOllamaRunning, testOllamaConnection } from './ollamaProvider.js';
import { callOpenAI, callOpenAIWithKey, isOpenAIAvailable } from './openaiProvider.js';
import { callAnthropic, callAnthropicWithKey, isAnthropicAvailable } from './anthropicProvider.js';

// Module-level state
const state = {
  groqAvailable: true,
  ollamaAvailable: null,
  openaiAvailable: null,
  anthropicAvailable: null,
  lastGroqFailure: null,
  groqCooldownMs: 60000,
  totalCallCount: 0
};

/**
 * Check if we should try Groq (respects cooldown)
 * @returns {boolean}
 */
function shouldTryGroq() {
  if (!process.env.GROQ_API_KEY) {
    return false;
  }
  if (state.groqAvailable) {
    return true;
  }
  // Check if cooldown has passed
  if (state.lastGroqFailure && (state.lastGroqFailure + state.groqCooldownMs < Date.now())) {
    state.groqAvailable = true;
    console.log('🔄 Groq cooldown expired, retrying Groq');
    return true;
  }
  return false;
}

/**
 * Get current LLM status
 * @returns {Promise<Object>} - Current LLM status with provider health
 */
export async function getLLMStatus() {
  const health = await checkProviderHealth();
  
  // Determine active provider based on priority and availability
  let provider = 'none';
  if (health.groq.available && state.groqAvailable) {
    provider = 'groq';
  } else if (health.openai.available) {
    provider = 'openai';
  } else if (health.anthropic.available) {
    provider = 'anthropic';
  } else if (health.ollama.available) {
    provider = 'ollama';
  }

  return {
    provider,
    ...health,
    state: {
      groqAvailable: state.groqAvailable,
      ollamaAvailable: state.ollamaAvailable,
      openaiAvailable: state.openaiAvailable,
      anthropicAvailable: state.anthropicAvailable,
      lastGroqFailure: state.lastGroqFailure,
      totalCallCount: state.totalCallCount
    }
  };
}

/**
 * Get status of all providers (synchronous, no health check)
 * @returns {Object} - Quick status check without network calls
 */
export function getAllProvidersStatus() {
  return {
    groq: {
      available: !!process.env.GROQ_API_KEY && state.groqAvailable,
      inCooldown: !!(state.lastGroqFailure && (state.lastGroqFailure + state.groqCooldownMs > Date.now()))
    },
    openai: {
      available: isOpenAIAvailable()
    },
    anthropic: {
      available: isAnthropicAvailable()
    },
    ollama: {
      available: state.ollamaAvailable
    }
  };
}

/**
 * Check health of all LLM providers
 * @returns {Promise<Object>} - Health status of all providers
 */
export async function checkProviderHealth() {
  console.log('🔍 Checking LLM provider health...');
  
  const [groqResult, ollamaResult] = await Promise.allSettled([
    testGroqConnection(),
    testOllamaConnection()
  ]);
  
  const groqHealth = {
    available: groqResult.status === 'fulfilled' && groqResult.value?.success === true,
    ...(groqResult.status === 'fulfilled' ? groqResult.value : { error: groqResult.reason?.message })
  };
  
  const ollamaHealth = {
    available: ollamaResult.status === 'fulfilled' && ollamaResult.value?.success === true,
    ...(ollamaResult.status === 'fulfilled' ? ollamaResult.value : { error: ollamaResult.reason?.message })
  };
  
  // Update state based on health checks
  state.ollamaAvailable = ollamaHealth.available;
  
  let recommendedProvider = 'none';
  if (groqHealth.available && state.groqAvailable) {
    recommendedProvider = 'groq';
  } else if (isOpenAIAvailable()) {
    recommendedProvider = 'openai';
  } else if (isAnthropicAvailable()) {
    recommendedProvider = 'anthropic';
  } else if (ollamaHealth.available) {
    recommendedProvider = 'ollama';
  }
  
  const health = {
    groq: groqHealth,
    openai: {
      available: isOpenAIAvailable()
    },
    anthropic: {
      available: isAnthropicAvailable()
    },
    ollama: ollamaHealth,
    recommendedProvider
  };
  
  console.log(`📊 Provider health: Groq=${groqHealth.available}, OpenAI=${health.openai.available}, Anthropic=${health.anthropic.available}, Ollama=${ollamaHealth.available}, Recommended=${recommendedProvider}`);
  
  return health;
}

/**
 * Main LLM call function with automatic fallback chain
 * All agents call this function, never providers directly
 * 
 * Priority: Groq → OpenAI → Anthropic → Ollama
 * 
 * @param {string|Array} prompt - The user prompt (string) or messages array
 * @param {string} systemPrompt - The system prompt (if prompt is string)
 * @param {Object} options - Options object
 * @param {number} [options.temperature] - Temperature
 * @param {number} [options.maxTokens] - Max tokens
 * @param {boolean} [options.jsonMode] - Enable JSON response mode
 * @param {boolean} [options.preferOllama] - If true, try Ollama first
 * @param {string} [options.agentRole] - Agent role for model selection
 * @param {string} [options.model] - Specific model to use
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number }, provider: string }>}
 */
export async function callLLM(prompt, systemPrompt, options = {}) {
  // Handle both signature styles: (messages, options) or (prompt, systemPrompt, options)
  let messages;
  let opts;
  
  if (Array.isArray(prompt)) {
    // New style: callLLM(messages, options)
    messages = prompt;
    opts = systemPrompt || {};
  } else {
    // Old style: callLLM(prompt, systemPrompt, options)
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];
    opts = options;
  }
  
  const { preferOllama = false, agentRole, ...providerOptions } = opts;
  
  state.totalCallCount++;
  const callId = state.totalCallCount;
  const errors = [];
  
  console.log(`🤖 LLM call #${callId} initiated (agentRole: ${agentRole || 'default'})`);
  
  // Step 1: Try Ollama first if preferred
  if (preferOllama) {
    const ollamaRunning = await isOllamaRunning();
    if (ollamaRunning) {
      try {
        console.log(`📡 Attempting Ollama for call #${callId} (preferred)...`);
        const result = await callOllama(messages, { ...providerOptions, agentRole });
        state.ollamaAvailable = true;
        console.log(`✅ LLM call successful via ollama (${agentRole || 'default'})`);
        return { ...result, provider: 'ollama' };
      } catch (error) {
        state.ollamaAvailable = false;
        errors.push(`Ollama: ${error.message}`);
        console.log(`⚠️  Ollama error: ${error.message}, trying other providers...`);
      }
    } else {
      console.log('⚠️  Ollama is not running, skipping preferred Ollama');
    }
  }
  
  // Step 2: Try Groq
  if (shouldTryGroq() && !preferOllama) {
    try {
      console.log(`📡 Attempting Groq for call #${callId}...`);
      const result = await callGroq(messages, { ...providerOptions, agentRole });
      console.log(`✅ LLM call successful via groq (${agentRole || 'default'})`);
      return { ...result, provider: 'groq' };
    } catch (error) {
      if (error.message === 'GROQ_RATE_LIMIT' || error.code === 'GROQ_RATE_LIMIT') {
        state.groqAvailable = false;
        state.lastGroqFailure = Date.now();
        errors.push('Groq: rate limited');
        console.log('⚠️  Groq rate limited, falling back to next provider');
      } else if (error.message === 'GROQ_AUTH_ERROR' || error.code === 'GROQ_AUTH_ERROR') {
        errors.push('Groq: authentication error');
        console.error('❌ Groq authentication error - check your GROQ_API_KEY');
      } else {
        errors.push(`Groq: ${error.message}`);
        console.log(`⚠️  Groq error: ${error.message}, falling back to next provider`);
      }
    }
  } else if (process.env.GROQ_API_KEY) {
    errors.push('Groq: in cooldown');
  }
  
  // Step 3: Try OpenAI
  if (isOpenAIAvailable()) {
    try {
      console.log(`📡 Attempting OpenAI for call #${callId}...`);
      const result = await callOpenAI(messages, { ...providerOptions, agentRole });
      console.log(`✅ LLM call successful via openai (${agentRole || 'default'})`);
      return { ...result, provider: 'openai' };
    } catch (error) {
      if (error.message === 'OPENAI_RATE_LIMIT') {
        errors.push('OpenAI: rate limited');
      } else if (error.message === 'OPENAI_AUTH_ERROR') {
        errors.push('OpenAI: authentication error');
      } else {
        errors.push(`OpenAI: ${error.message}`);
      }
      console.log(`⚠️  OpenAI error: ${error.message}, falling back to next provider`);
    }
  }
  
  // Step 4: Try Anthropic
  if (isAnthropicAvailable()) {
    try {
      console.log(`📡 Attempting Anthropic for call #${callId}...`);
      const result = await callAnthropic(messages, { ...providerOptions, agentRole });
      console.log(`✅ LLM call successful via anthropic (${agentRole || 'default'})`);
      return { ...result, provider: 'anthropic' };
    } catch (error) {
      if (error.message === 'ANTHROPIC_RATE_LIMIT') {
        errors.push('Anthropic: rate limited');
      } else if (error.message === 'ANTHROPIC_AUTH_ERROR') {
        errors.push('Anthropic: authentication error');
      } else {
        errors.push(`Anthropic: ${error.message}`);
      }
      console.log(`⚠️  Anthropic error: ${error.message}, falling back to next provider`);
    }
  }
  
  // Step 5: Try Ollama as final fallback (if not already tried as preferred)
  if (!preferOllama) {
    const ollamaRunning = await isOllamaRunning();
    if (ollamaRunning) {
      try {
        console.log(`📡 Attempting Ollama for call #${callId} (fallback)...`);
        const result = await callOllama(messages, { ...providerOptions, agentRole });
        state.ollamaAvailable = true;
        console.log(`✅ LLM call successful via ollama (${agentRole || 'default'})`);
        return { ...result, provider: 'ollama' };
      } catch (error) {
        state.ollamaAvailable = false;
        errors.push(`Ollama: ${error.message}`);
      }
    } else {
      state.ollamaAvailable = false;
      errors.push('Ollama: not running');
    }
  }
  
  // All providers failed
  const errorSummary = errors.length > 0 
    ? errors.join('; ') 
    : 'No LLM providers available';
  throw new Error(`LLM_UNAVAILABLE: All LLM providers failed: ${errorSummary}`);
}

/**
 * Call LLM using user-provided credentials
 * @param {string|Array} prompt - The user prompt or messages array
 * @param {string} systemPrompt - The system prompt (if prompt is string)
 * @param {Object} options - Options object
 * @param {Object|null} userLLMConfig - User LLM configuration
 * @param {string} userLLMConfig.provider - Provider: 'groq'|'openai'|'anthropic'|'ollama'
 * @param {string} [userLLMConfig.apiKey] - User's API key for cloud providers
 * @param {string} [userLLMConfig.ollamaUrl] - Custom Ollama URL
 * @param {string} [userLLMConfig.modelName] - Custom model name
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number }, provider: string }>}
 */
export async function callLLMWithUserConfig(prompt, systemPrompt, options = {}, userLLMConfig = null) {
  // Handle both signature styles
  let messages;
  let opts;
  let userConfig;
  
  if (Array.isArray(prompt)) {
    messages = prompt;
    opts = systemPrompt || {};
    userConfig = options; // Third arg is config when using array style
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];
    opts = options;
    userConfig = userLLMConfig;
  }
  
  // If no user config, fall through to regular callLLM
  if (!userConfig) {
    return callLLM(messages, opts);
  }

  const { provider, apiKey, ollamaUrl, modelName } = userConfig;
  
  state.totalCallCount++;
  const callId = state.totalCallCount;
  
  // Apply custom model name if provided
  const optionsWithModel = modelName 
    ? { ...opts, model: modelName }
    : opts;

  console.log(`🤖 LLM call #${callId} with user config (provider: ${provider})`);

  switch (provider) {
    case 'groq':
      if (apiKey) {
        try {
          console.log(`📡 Attempting Groq with user key for call #${callId}...`);
          const result = await callGroqWithKey(apiKey, messages, optionsWithModel);
          console.log(`✅ LLM call successful via groq (user key)`);
          return { ...result, provider: 'groq' };
        } catch (error) {
          throw new Error(`Groq (user key): ${error.message}`);
        }
      }
      // Fall through to platform key if no user key
      return callLLM(messages, opts);

    case 'openai':
      if (!apiKey) {
        throw new Error('OpenAI requires an API key');
      }
      try {
        console.log(`📡 Attempting OpenAI with user key for call #${callId}...`);
        const result = await callOpenAIWithKey(apiKey, messages, optionsWithModel);
        console.log(`✅ LLM call successful via openai (user key)`);
        return { ...result, provider: 'openai' };
      } catch (error) {
        throw new Error(`OpenAI (user key): ${error.message}`);
      }

    case 'anthropic':
      if (!apiKey) {
        throw new Error('Anthropic requires an API key');
      }
      try {
        console.log(`📡 Attempting Anthropic with user key for call #${callId}...`);
        const result = await callAnthropicWithKey(apiKey, messages, optionsWithModel);
        console.log(`✅ LLM call successful via anthropic (user key)`);
        return { ...result, provider: 'anthropic' };
      } catch (error) {
        throw new Error(`Anthropic (user key): ${error.message}`);
      }

    case 'ollama':
      try {
        console.log(`📡 Attempting Ollama with user config for call #${callId}...`);
        const ollamaOptions = { ...optionsWithModel };
        if (ollamaUrl) {
          ollamaOptions.baseUrl = ollamaUrl;
        }
        const result = await callOllama(messages, ollamaOptions);
        console.log(`✅ LLM call successful via ollama (user config)`);
        return { ...result, provider: 'ollama' };
      } catch (error) {
        throw new Error(`Ollama: ${error.message}`);
      }

    default:
      // Unknown provider, fall back to platform chain
      console.log(`⚠️  Unknown provider "${provider}", falling back to platform chain`);
      return callLLM(messages, opts);
  }
}

/**
 * Reset provider state to defaults
 * Useful for testing
 */
export function resetProviderState() {
  state.groqAvailable = true;
  state.ollamaAvailable = null;
  state.openaiAvailable = null;
  state.anthropicAvailable = null;
  state.lastGroqFailure = null;
  state.totalCallCount = 0;
  console.log('🔄 Provider state reset to defaults');
}