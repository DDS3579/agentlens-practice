// server/src/llm/anthropicProvider.js

import Anthropic from '@anthropic-ai/sdk';

/**
 * Check if Anthropic is available (key exists and not empty)
 * @returns {boolean}
 */
export function isAnthropicAvailable() {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '');
}

/**
 * Call Anthropic Claude API with a prompt
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Options object
 * @param {string} [options.model] - Model to use (default: 'claude-haiku-4-5-20251001')
 * @param {number} [options.temperature] - Temperature (default: 0.3)
 * @param {number} [options.maxTokens] - Max tokens (default: 4000)
 * @param {boolean} [options.jsonMode] - Enable JSON response mode
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
export async function callAnthropic(messages, options = {}) {
  if (!isAnthropicAvailable()) {
    throw new Error('ANTHROPIC_AUTH_ERROR');
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  return executeAnthropicCall(client, messages, options);
}

/**
 * Call Anthropic with user's own API key instead of platform key
 * @param {string} apiKey - User's Anthropic API key
 * @param {Array|string} messages - Chat messages array OR user prompt string
 * @param {Object|string} options - Options object OR system prompt string
 * @param {Object} [optionsOverride] - Options if using old style
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
export async function callAnthropicWithKey(apiKey, messages, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ANTHROPIC_AUTH_ERROR');
  }

  const client = new Anthropic({
    apiKey: apiKey
  });

  return executeAnthropicCall(client, messages, options);
}

/**
 * Execute the actual Anthropic API call
 * @param {Anthropic} client - Anthropic client instance
 * @param {Array|string} promptOrMessages - The user prompt or messages array
 * @param {string|Object} systemPromptOrOptions - The system prompt or options
 * @param {Object} [additionalOptions] - Additional options if using old style
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
async function executeAnthropicCall(client, promptOrMessages, systemPromptOrOptions, additionalOptions = {}) {
  let messages;
  let options;
  let systemPrompt = '';

  if (Array.isArray(promptOrMessages)) {
    // New style
    options = systemPromptOrOptions || {};
    
    // Anthropic expects system prompt separately, not in messages
    const systemMsg = promptOrMessages.find(m => m.role === 'system');
    systemPrompt = systemMsg ? systemMsg.content : '';
    
    // Filter out system message from messages array
    messages = promptOrMessages.filter(m => m.role !== 'system');
  } else {
    // Legacy support for (prompt, systemPrompt, options)
    options = additionalOptions || {};
    systemPrompt = systemPromptOrOptions || 'You are a helpful assistant.';
    messages = [
      { role: 'user', content: promptOrMessages }
    ];
  }

  const model = options.model || 'claude-haiku-4-5-20251001';
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens || 4000;

  if (options.jsonMode) {
    systemPrompt += '\n\nRespond with valid JSON only. No markdown, no explanation.';
  }

  const requestOptions = {
    model: model,
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemPrompt,
    messages: messages
  };

  try {
    const response = await client.messages.create(requestOptions);

    const content = response.content[0]?.text || '';
    const usage = {
      promptTokens: response.usage?.input_tokens || 0,
      completionTokens: response.usage?.output_tokens || 0
    };

    return { content, usage };
  } catch (error) {
    if (error.status === 429 || error.error?.type === 'rate_limit_error') {
      throw new Error('ANTHROPIC_RATE_LIMIT');
    }

    if (error.status === 401 || error.status === 403 || error.error?.type === 'authentication_error') {
      throw new Error('ANTHROPIC_AUTH_ERROR');
    }

    throw new Error(`Anthropic API error: ${error.message || 'Unknown error'}`);
  }
}
