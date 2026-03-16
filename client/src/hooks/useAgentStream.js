// client/src/hooks/useAgentStream.js
import { useCallback, useRef } from 'react';
import useAgentStore from '../store/agentStore.js';
import useAuth from './useAuth.js';
import { apiFetch } from '../lib/apiClient.js';

export function useAgentStream() {
  const abortRef = useRef(null);
  const handleSSEEvent = useAgentStore((state) => state.handleSSEEvent);
  const startAnalysisState = useAgentStore((state) => state.startAnalysis);
  const { getToken } = useAuth();

  const parseSSEEvents = useCallback((text) => {
    const events = [];
    const parts = text.split('\n\n');

    for (const part of parts) {
      if (!part.trim()) continue;

      const lines = part.split('\n');
      let eventName = 'message';
      let eventData = null;

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          try {
            eventData = JSON.parse(dataStr);
          } catch (e) {
            eventData = dataStr;
          }
        }
      }

      if (eventData !== null) {
        events.push({ event: eventName, data: eventData });
      }
    }

    return events;
  }, []);

  const processStream = useCallback(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            const events = parseSSEEvents(buffer);
            for (const { event, data } of events) {
              handleSSEEvent(event, data);
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lastDoubleNewline = buffer.lastIndexOf('\n\n');
        if (lastDoubleNewline !== -1) {
          const completeEvents = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          const events = parseSSEEvents(completeEvents);
          for (const { event, data } of events) {
            handleSSEEvent(event, data);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      handleSSEEvent('session_error', { message: error.message });
    }
  }, [parseSSEEvents, handleSSEEvent]);

  const startAnalysis = useCallback(async (url, selectedPaths = []) => {
    try {
      const token = await getToken();
      abortRef.current = new AbortController();

      startAnalysisState(); // Updates UI state to "connecting"

      const response = await apiFetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ url, selectedPaths }),
        signal: abortRef.current.signal
      }, token);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      await processStream(response);

    } catch (error) {
      if (error.name === 'AbortError') return;
      handleSSEEvent('error', { error: error.message || 'Analysis failed' });
    }
  }, [getToken, startAnalysisState, processStream, handleSSEEvent]);

  const cancelAnalysis = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    useAgentStore.getState().set({ isAnalyzing: false, currentPhase: 'idle' });
  }, []);

  return { startAnalysis, cancelAnalysis };
}

export default useAgentStream;