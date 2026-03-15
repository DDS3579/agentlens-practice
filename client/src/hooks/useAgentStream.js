// client/src/hooks/useAgentStream.js
// This is the key update to handle concurrent agent updates

import { useEffect, useRef } from 'react';
import useAgentStore from '../store/agentStore';

export function useAgentStream(sessionId) {
  const handleSSEEvent = useAgentStore((state) => state.handleSSEEvent);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const url = `/api/analysis/stream?sessionId=${encodeURIComponent(sessionId)}`;
    console.log('[useAgentStream] Connecting to:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle all event types
    const eventTypes = [
      'connected',
      'pipeline_start',
      'repo_ready',
      'session_created',
      'agent_status',
      'agent_update',      // New: for parallel agent updates
      'phase_complete',    // New: for phase completion events
      'coordinator_plan',
      'agent_finding',
      'agent_communication',
      'session_status',
      'analysis_complete',
      'pipeline_complete', // New: for full pipeline completion
      'final_results',
      'session_error',
      'error',
      'memory_update',
      'fix_start',
      'fix_complete',
      'fix_failed',
      'fix_stream',
      'token_usage', // New: for LLM token usage tracking
    ];

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[useAgentStream] ${eventType}:`, data);
          
          // Pass to store handler - it now supports concurrent agent updates
          handleSSEEvent(eventType, data);
        } catch (err) {
          console.error(`[useAgentStream] Error parsing ${eventType}:`, err);
        }
      });
    });

    // Generic message handler for any unlisted events
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[useAgentStream] Generic message:', data);
        handleSSEEvent('message', data);
      } catch (err) {
        // Ignore non-JSON messages (keepalive, etc.)
      }
    };

    eventSource.onerror = (error) => {
      console.error('[useAgentStream] Connection error:', error);
      handleSSEEvent('error', { error: 'Connection lost' });
    };

    return () => {
      console.log('[useAgentStream] Disconnecting');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sessionId, handleSSEEvent]);

  return eventSourceRef;
}

export default useAgentStream;