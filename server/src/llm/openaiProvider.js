// server/src/llm/openaiProvider.js

import OpenAI from 'openai';

/**
 * Check if OpenAI is available (key exists and not empty)
 * @returns {boolean}
 */
export function isOpenAIAvailable() {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');
}

/**
 * Call OpenAI API with a prompt
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Options object
 * @param {string} [options.model] - Model to use (default: 'gpt-4o-mini')
 * @param {number} [options.temperature] - Temperature (default: 0.3)
 * @param {number} [options.maxTokens] - Max tokens (default: 4000)
 * @param {boolean} [options.jsonMode] - Enable JSON response mode
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
export async function callOpenAI(messages, options = {}) {
  if (!isOpenAIAvailable()) {
    throw new Error('OPENAI_AUTH_ERROR');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return executeOpenAICall(client, messages, options);
}

/**
 * Call OpenAI with user's own API key instead of platform key
 * @param {string} apiKey - User's OpenAI API key
 * @param {Array|string} messages - Chat messages array OR user prompt string
 * @param {Object|string} options - Options object OR system prompt string
 * @param {Object} [optionsOverride] - Options if using old style
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
export async function callOpenAIWithKey(apiKey, messages, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_AUTH_ERROR');
  }

  const client = new OpenAI({
    apiKey: apiKey
  });

  return executeOpenAICall(client, messages, options);
}

/**
 * Execute the actual OpenAI API call
 * @param {OpenAI} client - OpenAI client instance
 * @param {Array|string} promptOrMessages - The user prompt or messages array
 * @param {string|Object} systemPromptOrOptions - The system prompt or options
 * @param {Object} [additionalOptions] - Additional options if using old style
 * @returns {Promise<{ content: string, usage: { promptTokens: number, completionTokens: number } }>}
 */
async function executeOpenAICall(client, promptOrMessages, systemPromptOrOptions, additionalOptions = {}) {
  let messages;
  let options;

  if (Array.isArray(promptOrMessages)) {
    messages = promptOrMessages;
    options = systemPromptOrOptions || {};
  } else {
    // Legacy support for (prompt, systemPrompt, options)
    options = additionalOptions || {};
    const systemPrompt = systemPromptOrOptions || 'You are a helpful assistant.';
    messages = [
      { role: 'system', content: options.jsonMode ? systemPrompt + '\n\nRespond with valid JSON only.' : systemPrompt },
      { role: 'user', content: promptOrMessages }
    ];
  }

  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens || 4000;
  const jsonMode = options.jsonMode || false;

  const requestOptions = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens
  };

  if (jsonMode) {
    requestOptions.response_format = { type: 'json_object' };
  }

  try {
    const response = await client.chat.completions.create(requestOptions);

    const content = response.choices[0]?.message?.content || '';
    const usage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0
    };

    return { content, usage };
  } catch (error) {
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new Error('OPENAI_RATE_LIMIT');
    }

    if (error.status === 401 || error.status === 403 || error.code === 'invalid_api_key') {
      throw new Error('OPENAI_AUTH_ERROR');
    }

    throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
  }
}
