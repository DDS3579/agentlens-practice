import { useRef, useCallback } from 'react';
import useAgentStore from '../store/agentStore.js';

export default function useAgentStream() {
  const handleSSEEvent = useAgentStore((state) => state.handleSSEEvent);
  const startAnalysisStore = useAgentStore((state) => state.startAnalysis);
  const setError = useAgentStore((state) => state.setError);
  const reset = useAgentStore((state) => state.reset);

  const abortControllerRef = useRef(null);

  const startAnalysis = useCallback(async (url, selectedPaths) => {
    // Reset store and mark as analyzing
    startAnalysisStore();

    abortControllerRef.current = new AbortController();

    try {
      console.log('[useAgentStream] Starting analysis for:', url);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selectedPaths: selectedPaths || [] }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to start analysis: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining data in the buffer
          if (buffer.trim()) {
            processSSEBuffer(buffer, handleSSEEvent);
          }
          console.log('[useAgentStream] Stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by double newlines
        const messages = buffer.split('\n\n');
        // Keep the last chunk (may be incomplete)
        buffer = messages.pop();

        for (const message of messages) {
          processSSEBuffer(message, handleSSEEvent);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[useAgentStream] Analysis cancelled by user');
        return;
      }
      console.error('[useAgentStream] Error:', error);
      setError(error.message);
    }
  }, [startAnalysisStore, handleSSEEvent, setError]);

  const cancelAnalysis = useCallback(() => {
    console.log('[useAgentStream] Cancelling analysis');
    abortControllerRef.current?.abort();
    reset();
  }, [reset]);

  return { startAnalysis, cancelAnalysis };
}

/**
 * Process a single SSE message block (everything between \n\n delimiters)
 * Handles multi-line data: fields by concatenating them
 */
function processSSEBuffer(message, handleSSEEvent) {
  const trimmed = message.trim();
  if (!trimmed || trimmed.startsWith(':')) {
    // Comment or empty — skip (keepalive pings, etc.)
    return;
  }

  const lines = trimmed.split('\n');
  let eventName = null;
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
    // Ignore other fields (id:, retry:, etc.)
  }

  // Join all data: lines into one string (SSE spec says they should be joined with newlines)
  const dataStr = dataLines.join('\n');

  if (!dataStr) {
    return;
  }

  // If no event name was specified, default to 'message' (SSE spec default)
  const resolvedEvent = eventName || 'message';

  try {
    const data = JSON.parse(dataStr);
    console.log('[useAgentStream] Event:', resolvedEvent, data);
    handleSSEEvent(resolvedEvent, data);
  } catch (e) {
    // Not valid JSON — might be a plain text message
    console.warn('[useAgentStream] Failed to parse SSE data for event:', resolvedEvent, dataStr.substring(0, 100));
  }
}
