/**
 * Sets up SSE headers on an Express response object
 * @param {Object} res - Express response object
 */
export function setupSSEHeaders(res) {
  // If headers are already sent, don't try to set them again
  if (res.headersSent) {
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Write initial comment to establish connection
  res.write(': connected\n\n');
  
  // Flush headers if available
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

/**
 * Sends a single SSE event to the client
 * @param {Object} res - Express response object
 * @param {string} eventName - Name of the event
 * @param {Object} data - Data to send (will be JSON stringified)
 */
export function sendSSEEvent(res, eventName, data) {
  try {
    // Check if response is still writable
    if (res.writableEnded) {
      return;
    }
    
    const formattedEvent = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(formattedEvent);
  } catch (error) {
    // Silently ignore errors (connection may be closed)
  }
}

/**
 * Creates an SSE stream connected to a SharedMemory instance
 * @param {Object} res - Express response object
 * @param {Object} memory - SharedMemory instance
 * @returns {Function} Cleanup function
 */
export function createSSEStream(res, memory) {
  // Set up headers
  setupSSEHeaders(res);
  
  const sessionId = memory.get('sessionId');
  
  // Send initial connected event
  sendSSEEvent(res, 'connected', { 
    sessionId, 
    timestamp: Date.now() 
  });
  
  // Set up keepalive interval (every 15 seconds)
  const keepaliveInterval = setInterval(() => {
    if (!res.writableEnded) {
      try {
        res.write(': keepalive\n\n');
      } catch (error) {
        // Connection closed, cleanup will handle it
      }
    }
  }, 15000);
  
  // Event handlers
  const handlers = {
    'agent:status': (data) => {
      sendSSEEvent(res, 'agent_status', data);
    },
    
    'agent:finding': (data) => {
      sendSSEEvent(res, 'agent_finding', data);
    },
    
    'agent:communication': (data) => {
      sendSSEEvent(res, 'agent_communication', data);
    },
    
    'coordinator:plan': (data) => {
      sendSSEEvent(res, 'coordinator_plan', data);
    },
    
    'session:status': (data) => {
      sendSSEEvent(res, 'session_status', data);
      
      // If analysis is complete or errored, send final snapshot and close
      if (data.status === 'complete' || data.status === 'error') {
        sendSSEEvent(res, 'analysis_complete', memory.getSnapshot());
        setTimeout(() => {
          clearInterval(keepaliveInterval);
          if (!res.writableEnded) {
            res.end();
          }
        }, 500);
      }
    },
    
    'session:error': (data) => {
      sendSSEEvent(res, 'session_error', data);
    },
    
    'memory:update': (data) => {
      // Only forward specific key updates to avoid noise
      const keysToForward = ['status', 'plan', 'agentStatuses'];
      if (keysToForward.includes(data.key)) {
        sendSSEEvent(res, 'memory_update', data);
      }
    }
  };
  
  // Register all event handlers
  for (const [event, handler] of Object.entries(handlers)) {
    memory.on(event, handler);
  }
  
  // Cleanup function
  const cleanup = () => {
    clearInterval(keepaliveInterval);
    
    // Remove all listeners from memory emitter
    for (const [event, handler] of Object.entries(handlers)) {
      memory.emitter.removeListener(event, handler);
    }
    
    console.log(`SSE client disconnected: ${sessionId}`);
  };
  
  // Handle client disconnect
  res.on('close', cleanup);
  
  // Return cleanup function for manual cleanup
  return cleanup;
}

/**
 * Sends an error event and closes the connection
 * @param {Object} res - Express response object
 * @param {string} errorMessage - Error message to send
 * @param {string} sessionId - Session ID
 */
export function sendError(res, errorMessage, sessionId) {
  sendSSEEvent(res, 'error', { 
    error: errorMessage, 
    sessionId 
  });
  
  setTimeout(() => {
    if (!res.writableEnded) {
      res.end();
    }
  }, 200);
}

// server/src/streaming/sseEmitter.js
// Add this function to the existing file

/**
 * Sends an agent diff event to the client
 * Used for streaming code changes from the fix agent
 * 
 * @param {Object} res - Express response object (SSE stream)
 * @param {Object} diffData - Diff event data
 * @param {string} diffData.file - File path being edited
 * @param {number} diffData.lineStart - Start line number (1-indexed)
 * @param {number} diffData.lineEnd - End line number (1-indexed)
 * @param {string} diffData.newContent - New content to replace/insert
 * @param {string} diffData.editType - Type of edit: 'replace' | 'insert' | 'delete'
 * @param {string} diffData.agentName - Name of the agent making the edit
 * @param {string} diffData.message - Human-readable description of the change
 */
export function sendDiffEvent(res, {
  file,
  lineStart,
  lineEnd,
  newContent,
  editType = 'replace',
  agentName = 'FixAgent',
  message = 'Applying fix...',
}) {
  sendSSEEvent(res, 'agent_diff', {
    file,
    lineStart,
    lineEnd,
    newContent,
    editType,
    agentName,
    message,
    timestamp: Date.now(),
  });
}

/**
 * Sends an agent edit complete event
 * Called when all edits for a session are finished
 * 
 * @param {Object} res - Express response object (SSE stream)
 * @param {Object} data - Optional completion data
 */
export function sendEditCompleteEvent(res, data = {}) {
  sendSSEEvent(res, 'agent_edit_complete', {
    ...data,
    timestamp: Date.now(),
  });
}

// Make sure to export the new functions
export {
  setupSSEHeaders,
  sendSSEEvent,
  createSSEStream,
  sendError,
  sendDiffEvent,      // NEW
  sendEditCompleteEvent, // NEW
};