import { useRef, useCallback } from 'react';
import useAgentStore from '../store/agentStore.js';

export default function useAgentStream() {
  const handleSSEEvent = useAgentStore((state) => state.handleSSEEvent);
  const startAnalysisStore = useAgentStore((state) => state.startAnalysis);
  const setError = useAgentStore((state) => state.setError);
  const reset = useAgentStore((state) => state.reset);

  const abortControllerRef = useRef(null);

  const startAnalysis = useCallback(async (url, selectedPaths) => {
    startAnalysisStore();

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selectedPaths: selectedPaths || [] }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis: ' + response.statusText);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const messages = buffer.split('\n\n');
        buffer = messages.pop();

        for (const message of messages) {
          if (!message.trim() || message.trim().startsWith(':')) {
            continue;
          }

          const lines = message.split('\n');
          let eventName = null;
          let dataStr = null;

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.slice(5).trim();
            }
          }

          if (eventName && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              handleSSEEvent(eventName, data);
            } catch {
              // ignore parse errors for malformed events
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setError(error.message);
    }
  }, [startAnalysisStore, handleSSEEvent, setError]);

  const cancelAnalysis = useCallback(() => {
    abortControllerRef.current?.abort();
    reset();
  }, [reset]);

  return { startAnalysis, cancelAnalysis };
}