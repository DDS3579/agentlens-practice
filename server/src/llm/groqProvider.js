// server/src/llm/groqProvider.js

import Groq from 'groq-sdk';

export const MODEL_MAP = {
  coordinator: 'llama-3.3-70b-versatile',
  security: 'llama-3.3-70b-versatile',
  writer: 'llama-3.3-70b-versatile',
  architecture: 'llama-3.3-70b-versatile',
  fix: 'llama-3.3-70b-versatile',
  default: 'llama-3.3-70b-versatile',
};

export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Please set the GROQ_API_KEY environment variable.'
    );
  }

  return new Groq({ apiKey });
}

export async function callGroq(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Please set the GROQ_API_KEY environment variable.'
    );
  }

  const client = new Groq({ apiKey });
  return executeGroqCall(client, messages, options);
}

/**
 * Call Groq with user's own API key
 * @param {string} apiKey - User's Groq API key
 * @param {Array} messages - Chat messages
 * @param {Object} options - Options object
 */
export async function callGroqWithKey(apiKey, messages, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GROQ_AUTH_ERROR: API key is required');
  }

  const client = new Groq({ apiKey });
  return executeGroqCall(client, messages, options);
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Internal function to execute Groq API call with retry logic
 * @param {Groq} client - Groq client instance
 * @param {Array} messages - Chat messages
 * @param {Object} options - Options object
 */
async function executeGroqCall(client, messages, options = {}) {
  const {
    model: modelOverride,
    temperature = 0.2,
    maxTokens = 8192,
    agentRole,
    jsonMode = false,
  } = options;

  let model;
  if (agentRole && MODEL_MAP[agentRole]) {
    model = MODEL_MAP[agentRole];
  } else if (modelOverride) {
    model = modelOverride;
  } else {
    model = MODEL_MAP.default;
  }

  const requestParams = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    requestParams.response_format = { type: 'json_object' };
  }

  // Retry logic: up to 2 retries for transient errors
  const MAX_RETRIES = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create(requestParams);

      let content = response.choices[0].message.content;

      if (jsonMode && content) {
        try {
          content = JSON.parse(content);
        } catch {
          // Parse failed — return raw string as-is
        }
      }

      const usage = response.usage || {};

      return {
        content,
        model,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        },
      };
    } catch (error) {
      lastError = error;
      const status = error.status || error.statusCode;

      // Non-retryable errors — throw immediately
      if (status === 401) {
        throw new Error('GROQ_AUTH_ERROR: Check your GROQ_API_KEY');
      }

      // Retryable errors — retry with delay
      if ((status === 429 || status === 503 || status === 500) && attempt < MAX_RETRIES) {
        const delay = 2000 * (attempt + 1); // 2s, 4s
        console.log(`⚠️  Groq transient error (${status}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(delay);
        continue;
      }

      // Final attempt or non-retryable status
      if (status === 429) {
        throw new Error('GROQ_RATE_LIMIT');
      }

      if (status === 503 || status === 500) {
        throw new Error('GROQ_SERVICE_ERROR: Service unavailable');
      }

      throw new Error(`GROQ_ERROR: ${error.message || String(error)}`);
    }
  }

  // Should not reach here, but just in case
  throw new Error(`GROQ_ERROR: ${lastError?.message || 'Unknown error after retries'}`);
}

export async function testGroqConnection() {
  try {
    const result = await callGroq(
      [{ role: 'user', content: 'Say OK' }],
      {
        maxTokens: 10,
        temperature: 0,
      }
    );

    return {
      success: true,
      model: result.model,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}
