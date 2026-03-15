// client/src/components/editor/AgentEditStream.jsx
import { useEffect, useRef, useCallback } from 'react'

/**
 * AgentEditStream - Logic component that connects to SSE for agent edits
 * 
 * Listens for "agent_diff" events and forwards them to the editor
 * 
 * @param {Object} props
 * @param {string} props.sessionId - Session ID for SSE connection
 * @param {string} props.activeFile - Currently active file path
 * @param {Function} props.onEdit - Callback when edit received: (file, lineStart, lineEnd, newContent, editType)
 * @param {Function} props.onEditComplete - Callback when all edits complete
 * @param {Function} props.onAgentStatusChange - Callback for agent status updates
 */
export default function AgentEditStream({
  sessionId,
  activeFile,
  onEdit,
  onEditComplete,
  onAgentStatusChange,
}) {
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!sessionId) return

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = `/api/fix/stream?sessionId=${encodeURIComponent(sessionId)}`
    console.log('[AgentEditStream] Connecting to:', url)

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    // Handle connection open
    eventSource.onopen = () => {
      console.log('[AgentEditStream] Connected')
      reconnectAttempts.current = 0
    }

    // Handle agent_diff events
    eventSource.addEventListener('agent_diff', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[AgentEditStream] Received agent_diff:', data)

        const {
          file,
          lineStart,
          lineEnd,
          newContent,
          editType,
          agentName,
          message,
        } = data

        // Update agent status
        if (onAgentStatusChange) {
          onAgentStatusChange({
            agentName: agentName || 'FixAgent',
            message: message || 'Applying fix...',
            file,
          })
        }

        // Apply the edit
        if (onEdit) {
          onEdit(file, lineStart, lineEnd, newContent, editType || 'replace')
        }
      } catch (err) {
        console.error('[AgentEditStream] Error parsing agent_diff:', err)
      }
    })

    // Handle agent_edit_complete event
    eventSource.addEventListener('agent_edit_complete', (event) => {
      console.log('[AgentEditStream] Edit complete')
      if (onEditComplete) {
        onEditComplete()
      }
    })

    // Handle fix_complete event (alternative event name)
    eventSource.addEventListener('fix_complete', (event) => {
      console.log('[AgentEditStream] Fix complete')
      if (onEditComplete) {
        onEditComplete()
      }
    })

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('[AgentEditStream] Connection error:', error)
      eventSource.close()

      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(3000 * reconnectAttempts.current, 15000)
        console.log(`[AgentEditStream] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      } else {
        console.error('[AgentEditStream] Max reconnection attempts reached')
      }
    }

    // Handle generic messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[AgentEditStream] Generic message:', data)
      } catch (err) {
        // Ignore non-JSON messages (like keepalive comments)
      }
    }
  }, [sessionId, onEdit, onEditComplete, onAgentStatusChange])

  // Connect on mount and when sessionId changes
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('[AgentEditStream] Disconnecting')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  // This is a logic-only component, renders nothing
  return null
}