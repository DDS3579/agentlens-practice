// server/src/llm/ollamaProvider.js

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export const OLLAMA_MODEL_MAP = {
  coordinator: 'llama3.1:8b',
  security: 'deepseek-r1:7b',
  writer: 'llama3.1:8b',
  architecture: 'llama3.1:8b',
  default: 'llama3.1:8b',
};

export async function isOllamaRunning() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAvailableModels() {
  try {
    const running = await isOllamaRunning();
    if (!running) {
      return [];
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const models = data.models || [];

    return models.map((m) => m.name);
  } catch {
    return [];
  }
}

export async function callOllama(messages, options = {}) {
  const {
    model: modelOverride,
    temperature = 0.3,
    agentRole,
    jsonMode = false,
    timeoutMs = 120000,
  } = options;

  let model;
  if (agentRole && OLLAMA_MODEL_MAP[agentRole]) {
    model = OLLAMA_MODEL_MAP[agentRole];
  } else if (modelOverride) {
    model = modelOverride;
  } else {
    model = OLLAMA_MODEL_MAP.default;
  }

  // If jsonMode, append instruction to last user message
  let processedMessages = [...messages];
  if (jsonMode) {
    processedMessages = processedMessages.map((msg, index) => {
      if (index === processedMessages.length - 1 && msg.role === 'user') {
        return {
          ...msg,
          content: `${msg.content}\n\nRespond with valid JSON only.`,
        };
      }
      return { ...msg };
    });

    // If the last message isn't a user message, find the last user message
    const lastUserIndex = processedMessages.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex !== -1 && lastUserIndex !== processedMessages.length - 1) {
      processedMessages[lastUserIndex] = {
        ...processedMessages[lastUserIndex],
        content: `${processedMessages[lastUserIndex].content}\n\nRespond with valid JSON only.`,
      };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: processedMessages,
        stream: false,
        options: {
          temperature,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new Error(`OLLAMA_MODEL_NOT_FOUND: ${model}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OLLAMA_ERROR: ${errorText}`);
    }

    const data = await response.json();
    let content = data.message?.content || '';

    if (jsonMode && content) {
      try {
        content = JSON.parse(content);
      } catch {
        // Parse failed — return raw string as-is
      }
    }

    return {
      content,
      model,
      usage: null,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.message?.startsWith('OLLAMA_MODEL_NOT_FOUND')) {
      throw error;
    }

    if (error.message?.startsWith('OLLAMA_ERROR')) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new Error('OLLAMA_TIMEOUT: Model took too long to respond');
    }

    if (
      error.cause?.code === 'ECONNREFUSED' ||
      error.cause?.code === 'ECONNRESET' ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('ECONNREFUSED')
    ) {
      throw new Error('OLLAMA_NOT_RUNNING');
    }

    throw new Error(`OLLAMA_ERROR: ${error.message || String(error)}`);
  }
}

export async function testOllamaConnection() {
  try {
    const running = await isOllamaRunning();

    if (!running) {
      return {
        success: false,
        error: 'Ollama is not running or not reachable',
      };
    }

    const availableModels = await getAvailableModels();

    const result = await callOllama(
      [{ role: 'user', content: 'Say OK' }],
      {
        timeoutMs: 30000,
      }
    );

    return {
      success: true,
      model: result.model,
      availableModels,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}
