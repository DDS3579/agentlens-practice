// server/src/llm/groqProvider.js

import Groq from 'groq-sdk';

export const MODEL_MAP = {
  coordinator: 'llama-3.3-70b-versatile',
  security: 'llama-3.3-70b-versatile',
  writer: 'llama-3.1-8b-instant',
  architecture: 'mixtral-8x7b-32768',
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
  const {
    model: modelOverride,
    temperature = 0.3,
    maxTokens = 4096,
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

  const client = createGroqClient();

  const requestParams = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    requestParams.response_format = { type: 'json_object' };
  }

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
    const status = error.status || error.statusCode;

    if (status === 429) {
      throw new Error('GROQ_RATE_LIMIT');
    }

    if (status === 401) {
      throw new Error('GROQ_AUTH_ERROR: Check your GROQ_API_KEY');
    }

    if (status === 503 || status === 500) {
      throw new Error('GROQ_SERVICE_ERROR: Service unavailable');
    }

    throw new Error(`GROQ_ERROR: ${error.message || String(error)}`);
  }
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
