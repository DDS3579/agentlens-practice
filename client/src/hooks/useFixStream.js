
// client/src/hooks/useFixStream.js

import { useCallback, useRef } from 'react';
import useFixStore from '../store/fixStore.js';
import useAuth from './useAuth.js';

export function useFixStream() {
  const abortRef = useRef(null);
  const fixStore = useFixStore();
  const { getToken } = useAuth();

  /**
   * Parse SSE events from a chunk of text
   * @param {string} text - Raw SSE text
   * @returns {Array<{ event: string, data: object }>}
   */
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

  /**
   * Process a single SSE event
   * @param {string} eventName - Event name
   * @param {object} data - Event data
   */
  const handleSSEEvent = useCallback((eventName, data) => {
    switch (eventName) {
      case 'fix_start':
        fixStore.setCurrentFix(data.bugId, data.current);
        fixStore.startStream();
        break;

      case 'fix_stream':
        fixStore.appendStream(data.chunk);
        break;

      case 'fix_complete':
        fixStore.markBugFixed(data.bugId);
        fixStore.updateFileContent(data.file, data.fixedContent);
        fixStore.endStream();
        break;

      case 'fix_failed':
        fixStore.markBugFailed(data.bugId, data.error);
        fixStore.endStream();
        break;

      case 'fix_session_start':
        // Session started, nothing special to do
        break;

      case 'fix_session_complete':
        fixStore.stopFixing();
        break;

      case 'fix_error':
        fixStore.setError(data.error);
        fixStore.stopFixing();
        break;

      default:
        console.warn('Unknown fix event:', eventName, data);
    }
  }, [fixStore]);

  /**
   * Read and process SSE stream
   * @param {Response} response - Fetch response
   */
  const processStream = useCallback(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const events = parseSSEEvents(buffer);
            for (const { event, data } of events) {
              handleSSEEvent(event, data);
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (separated by \n\n)
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
      if (error.name === 'AbortError') {
        // Stream was cancelled, this is expected
        return;
      }
      throw error;
    }
  }, [parseSSEEvents, handleSSEEvent]);

  /**
   * Start fixing a single bug
   * @param {object} bug - Bug object
   * @param {string} fileContent - Current file content
   * @param {string} analysisId - Analysis ID
   */
  const startSingleFix = useCallback(async (bug, fileContent, analysisId) => {
    try {
      const token = await getToken();

      // Set up abort controller
      abortRef.current = new AbortController();

      // Start fixing state
      fixStore.startFixing(1);

      const response = await fetch('/api/fix/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bugId: bug.id,
          bug,
          fileContent,
          analysisId
        }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      await processStream(response);

    } catch (error) {
      if (error.name === 'AbortError') {
        // Cancelled by user
        return;
      }
      fixStore.setError(error.message);
      fixStore.stopFixing();
    }
  }, [getToken, fixStore, processStream]);

  /**
   * Start fixing all bugs
   * @param {Array} bugs - Array of bug objects
   * @param {object} fileContents - Map of file paths to content
   * @param {string} analysisId - Analysis ID
   */
  const startAllFixes = useCallback(async (bugs, fileContents, analysisId) => {
    try {
      const token = await getToken();

      // Set up abort controller
      abortRef.current = new AbortController();

      // Start fixing state with total count
      fixStore.startFixing(bugs.length);

      const response = await fetch('/api/fix/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bugs,
          fileContents,
          analysisId
        }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      await processStream(response);

    } catch (error) {
      if (error.name === 'AbortError') {
        // Cancelled by user
        return;
      }
      fixStore.setError(error.message);
      fixStore.stopFixing();
    }
  }, [getToken, fixStore, processStream]);

  /**
   * Cancel the current fix operation
   */
  const cancelFix = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    fixStore.stopFixing();
  }, [fixStore]);

  return {
    startSingleFix,
    startAllFixes,
    cancelFix,
    isFixing: fixStore.isFixing
  };
}
