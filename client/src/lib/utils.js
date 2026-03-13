export function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

export function humanizeBugType(type) {
  if (!type) return 'Unknown';
  
  const typeMap = {
    'sql_injection': 'SQL Injection',
    'xss': 'XSS',
    'hardcoded_secret': 'Hardcoded Secret',
    'missing_validation': 'Missing Validation',
    'unhandled_error': 'Unhandled Error',
    'auth': 'Authentication',
    'missing_rate_limiting': 'Rate Limiting',
    'command_injection': 'Command Injection',
    'path_traversal': 'Path Traversal',
    'insecure_deserialization': 'Insecure Deserialization',
    'ssrf': 'SSRF',
    'xxe': 'XXE',
    'csrf': 'CSRF',
    'open_redirect': 'Open Redirect',
    'sensitive_data_exposure': 'Data Exposure',
    'broken_auth': 'Broken Auth',
    'security_misconfiguration': 'Misconfiguration',
    'other': 'Code Issue'
  };
  
  if (typeMap[type.toLowerCase()]) {
    return typeMap[type.toLowerCase()];
  }
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSeverityColor(severity) {
  const colorMap = {
    'critical': 'bg-red-900 text-red-300',
    'high': 'bg-orange-900 text-orange-300',
    'medium': 'bg-yellow-900 text-yellow-300',
    'low': 'bg-blue-900 text-blue-300',
    'info': 'bg-gray-800 text-gray-300'
  };
  
  return colorMap[severity?.toLowerCase()] || 'bg-gray-800 text-gray-300';
}

export function getImpactColor(impact) {
  const colorMap = {
    'high': 'bg-red-900 text-red-300',
    'medium': 'bg-yellow-900 text-yellow-300',
    'low': 'bg-blue-900 text-blue-300'
  };
  
  return colorMap[impact?.toLowerCase()] || 'bg-gray-800 text-gray-300';
}

export function getAgentEmoji(agentName) {
  const emojiMap = {
    'coordinator': '🧠',
    'security': '🛡️',
    'writer': '📝',
    'architecture': '🏗️',
    'technical_writer': '📝',
    'architecture_review': '🏗️',
    'security_specialist': '🛡️'
  };
  
  return emojiMap[agentName?.toLowerCase()] || '🤖';
}

export function getAgentDisplayName(agentName) {
  const nameMap = {
    'coordinator': 'Coordinator',
    'security': 'Security Specialist',
    'security_specialist': 'Security Specialist',
    'writer': 'Technical Writer',
    'technical_writer': 'Technical Writer',
    'architecture': 'Architecture Review',
    'architecture_review': 'Architecture Review'
  };
  
  return nameMap[agentName?.toLowerCase()] || agentName || 'Agent';
}

export function truncate(str, maxLength = 100) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function calculateOverallScore(compilationResult, securitySummary, architectureResult) {
  // Priority 1: Use compilation result's overall score
  if (compilationResult?.codeHealthScore !== undefined && compilationResult?.codeHealthScore !== null) {
    return compilationResult.codeHealthScore;
  }
  
  // Priority 2: Average of available scores
  const scores = [];
  
  if (securitySummary?.overallSecurityScore !== undefined) {
    scores.push(securitySummary.overallSecurityScore);
  }
  if (compilationResult?.scoreBreakdown?.security !== undefined) {
    scores.push(compilationResult.scoreBreakdown.security);
  }
  if (architectureResult?.architectureScore !== undefined) {
    scores.push(architectureResult.architectureScore);
  }
  if (compilationResult?.scoreBreakdown?.architecture !== undefined) {
    scores.push(compilationResult.scoreBreakdown.architecture);
  }
  
  if (scores.length > 0) {
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }
  
  // Fallback
  return 50;
}

export function scoreToGrade(score) {
  if (score === null || score === undefined) {
    return { grade: '?', color: '#6b7280', label: 'Unknown' };
  }
  
  if (score >= 90) {
    return { grade: 'A', color: '#34d399', label: 'Excellent' };
  }
  if (score >= 75) {
    return { grade: 'B', color: '#60a5fa', label: 'Good' };
  }
  if (score >= 60) {
    return { grade: 'C', color: '#fbbf24', label: 'Fair' };
  }
  if (score >= 40) {
    return { grade: 'D', color: '#f97316', label: 'Poor' };
  }
  return { grade: 'F', color: '#f87171', label: 'Critical' };
}