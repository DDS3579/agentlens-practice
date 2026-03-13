import { callGroq, testGroqConnection } from './groqProvider.js';
import { callOllama, isOllamaRunning, testOllamaConnection } from './ollamaProvider.js';

// Module-level state (not exported)
const state = {
  groqAvailable: true,
  ollamaAvailable: null,
  lastGroqFailure: null,
  groqCooldownMs: 60000,
  totalCallCount: 0
};

// Check if we should try Groq (not exported)
function shouldTryGroq() {
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
 * Main LLM call function - THE CORE FUNCTION
 * All agents call this function, never Groq or Ollama directly
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Options for the LLM call
 * @param {boolean} options.preferOllama - If true, try Ollama first
 * @param {string} options.agentRole - Agent role for model selection
 * @returns {Promise<Object>} - LLM response with provider info
 */
export async function callLLM(messages, options = {}) {
  const { preferOllama = false, agentRole, ...providerOptions } = options;
  
  state.totalCallCount++;
  const callId = state.totalCallCount;
  
  console.log(`🤖 LLM call #${callId} initiated (agentRole: ${agentRole || 'default'})`);
  
  // Step 1: Try Groq (unless preferOllama is set)
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
        console.log('⚠️  Groq rate limited, falling back to Ollama');
      } else if (error.message === 'GROQ_AUTH_ERROR' || error.code === 'GROQ_AUTH_ERROR') {
        console.error('❌ Groq authentication error - check your GROQ_API_KEY');
        throw error;
      } else {
        console.log(`⚠️  Groq error: ${error.message}, falling back to Ollama`);
      }
      // Continue to Step 2
    }
  }
  
  // Step 2: Try Ollama
  const ollamaRunning = await isOllamaRunning();
  if (ollamaRunning) {
    try {
      console.log(`📡 Attempting Ollama for call #${callId}...`);
      const result = await callOllama(messages, { ...providerOptions, agentRole });
      state.ollamaAvailable = true;
      console.log(`✅ LLM call successful via ollama (${agentRole || 'default'})`);
      return { ...result, provider: 'ollama' };
    } catch (error) {
      state.ollamaAvailable = false;
      console.log(`⚠️  Ollama error: ${error.message}`);
      // Continue to Step 3
    }
  } else {
    console.log('⚠️  Ollama is not running, skipping');
    state.ollamaAvailable = false;
  }
  
  // Step 3: No providers available
  throw new Error(
    'LLM_UNAVAILABLE: Both Groq and Ollama are unavailable. ' +
    'Check your GROQ_API_KEY and ensure Ollama is running.'
  );
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
  
  let recommendedProvider = 'none';
  if (groqHealth.available) {
    recommendedProvider = 'groq';
  } else if (ollamaHealth.available) {
    recommendedProvider = 'ollama';
  }
  
  const health = {
    groq: groqHealth,
    ollama: ollamaHealth,
    recommendedProvider
  };
  
  console.log(`📊 Provider health: Groq=${groqHealth.available}, Ollama=${ollamaHealth.available}, Recommended=${recommendedProvider}`);
  
  return health;
}

/**
 * Reset provider state to defaults
 * Useful for testing
 */
export function resetProviderState() {
  state.groqAvailable = true;
  state.ollamaAvailable = null;
  state.lastGroqFailure = null;
  state.totalCallCount = 0;
  console.log('🔄 Provider state reset to defaults');
}

/**
 * Get current LLM status
 * Used by health check endpoint
 * @returns {Promise<Object>} - Current LLM status
 */
export async function getLLMStatus() {
  const health = await checkProviderHealth();
  return {
    ...health,
    state: {
      groqAvailable: state.groqAvailable,
      ollamaAvailable: state.ollamaAvailable,
      lastGroqFailure: state.lastGroqFailure,
      totalCallCount: state.totalCallCount
    }
  };
}
