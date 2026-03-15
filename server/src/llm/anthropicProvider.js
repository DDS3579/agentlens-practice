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
export async function callAnthropic(prompt, systemPrompt, options = {}) {
  if (!isAnthropicAvailable()) {
    throw new Error('ANTHROPIC_AUTH_ERROR');
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  return executeAnthropicCall(client, prompt, systemPrompt, options);
}

/**
 * Call Anthropic with user's own API key instead of platform key
 * @param {string} apiKey - User's Anthropic API key
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Options object
 * @param {string} [options.model] - Model to use (default: 'claude-haiku-4-5-20251001')
 * @param {number} [options.temperature] - Temperature (default: 0.3)
 * @param {number} [options.maxTokens] - Max tokens (default: 4000)
 * @param {boolean} [options.jsonMode] - Enable JSON response mode
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
export async function callAnthropicWithKey(apiKey, prompt, systemPrompt, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ANTHROPIC_AUTH_ERROR');
  }

  const client = new Anthropic({
    apiKey: apiKey
  });

  return executeAnthropicCall(client, prompt, systemPrompt, options);
}

/**
 * Execute the actual Anthropic API call
 * @param {Anthropic} client - Anthropic client instance
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Options object
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
async function executeAnthropicCall(client, prompt, systemPrompt, options = {}) {
  const model = options.model || 'claude-haiku-4-5-20251001';
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens || 4000;

  let finalSystemPrompt = systemPrompt;
  if (options.jsonMode) {
    finalSystemPrompt = systemPrompt + '\n\nRespond with valid JSON only. No markdown, no explanation.';
  }

  const messages = [
    { role: 'user', content: prompt }
  ];

  const requestOptions = {
    model: model,
    max_tokens: maxTokens,
    temperature: temperature,
    system: finalSystemPrompt,
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
