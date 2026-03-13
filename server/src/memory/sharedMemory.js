import { EventEmitter } from 'events';

class SharedMemory {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.store = {
      sessionId: sessionId,
      status: 'idle',
      plan: null,
      repoSummary: null,
      files: [],
      bugs: [],
      documentation: '',
      refactors: [],
      messages: [],
      agentStatuses: {
        coordinator: 'idle',
        security: 'idle',
        writer: 'idle',
        architecture: 'idle'
      },
      startTime: null,
      endTime: null,
      error: null
    };
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(20);
  }

  get(key) {
    if (key === undefined || key === null) {
      return this.store;
    }
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
    this.emitter.emit('memory:update', {
      key,
      value,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  setAgentStatus(agentName, status, currentAction = null) {
    this.store.agentStatuses[agentName] = status;
    
    if (currentAction !== null) {
      this.store.agentCurrentActions = this.store.agentCurrentActions || {};
      this.store.agentCurrentActions[agentName] = currentAction;
    }
    
    this.emitter.emit('agent:status', {
      agentName,
      status,
      currentAction,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    
    return this;
  }

  addBug(bug) {
    this.store.bugs.push(bug);
    this.emitter.emit('agent:finding', {
      type: 'bug',
      data: bug,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  addRefactor(refactor) {
    this.store.refactors.push(refactor);
    this.emitter.emit('agent:finding', {
      type: 'refactor',
      data: refactor,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  addMessage(fromAgent, toAgent, content, type = 'context') {
    const message = {
      id: Date.now(),
      fromAgent,
      toAgent,
      content,
      type,
      timestamp: Date.now()
    };
    this.store.messages.push(message);
    this.emitter.emit('agent:communication', {
      ...message,
      sessionId: this.sessionId
    });
    return this;
  }

  setStatus(status) {
    this.store.status = status;
    
    if (status === 'analyzing' && !this.store.startTime) {
      this.store.startTime = Date.now();
    }
    
    if (status === 'complete' || status === 'error') {
      this.store.endTime = Date.now();
    }
    
    this.emitter.emit('session:status', {
      status,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    
    return this;
  }

  setPlan(plan) {
    this.store.plan = plan;
    this.emitter.emit('coordinator:plan', {
      plan,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  setDocumentation(markdown) {
    this.store.documentation = markdown;
    this.emitter.emit('agent:finding', {
      type: 'documentation',
      data: markdown,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  setError(error) {
    this.store.error = error.message || error;
    this.setStatus('error');
    this.emitter.emit('session:error', {
      error: this.store.error,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    return this;
  }

  on(event, callback) {
    this.emitter.on(event, callback);
    return this;
  }

  getSnapshot() {
    return {
      ...this.store,
      files: this.store.files.map(f => ({
        path: f.path,
        language: f.language,
        size: f.size
      }))
    };
  }

  destroy() {
    this.emitter.removeAllListeners();
    this.store = null;
  }
}

// Session Manager
const sessions = new Map();

export function createSession(sessionId) {
  const memory = new SharedMemory(sessionId);
  sessions.set(sessionId, memory);
  return memory;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

export function destroySession(sessionId) {
  const instance = sessions.get(sessionId);
  if (instance) {
    instance.destroy();
    sessions.delete(sessionId);
  }
}

export function getActiveSessions() {
  return Array.from(sessions.keys());
}

export default SharedMemory;
