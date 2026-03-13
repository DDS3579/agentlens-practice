// client/src/lib/demoData.js

export const DEMO_RESULTS = {
  sessionId: 'demo-session-001',
  repoSummary: {
    owner: 'demo-user',
    repo: 'vulnerable-express-api',
    branch: 'main',
    projectType: 'Node.js API',
    languages: { javascript: 4 },
    securitySensitiveFiles: ['auth.js', 'db.js'],
    totalFiles: 4,
    analyzedFiles: 4
  },
  plan: {
    projectType: 'Node.js REST API',
    executionOrder: ['security', 'writer', 'architecture'],
    agentFocusAreas: {
      security: 'Focus on auth.js and db.js — authentication flows and database access patterns show high risk',
      writer: 'Generate API endpoint documentation, environment variable reference, and security best practices',
      architecture: 'Evaluate middleware structure, error handling strategy, and input validation architecture'
    },
    priorityFiles: ['auth.js', 'db.js', 'server.js'],
    riskLevel: 'high',
    estimatedIssues: '5-8 security issues likely',
    planSummary: 'This Node.js API has critical security vulnerabilities in authentication and database layers requiring immediate attention.'
  },
  security: {
    bugs: [
      {
        id: 'sec_001',
        severity: 'critical',
        type: 'sql_injection',
        title: 'SQL Injection in Login Function',
        description: 'User input is directly concatenated into SQL query without sanitization. An attacker can bypass authentication or extract sensitive data by injecting malicious SQL.',
        file: 'auth.js',
        line: 9,
        code: "const query = `SELECT * FROM users WHERE username = '${username}'`",
        suggestedFix: 'Use parameterized queries to separate SQL from user input.',
        fixedCode: "const query = 'SELECT * FROM users WHERE username = $1'\nawait db.query(query, [username])"
      },
      {
        id: 'sec_002',
        severity: 'critical',
        type: 'hardcoded_secret',
        title: 'Hardcoded JWT Secret',
        description: 'JWT signing secret is hardcoded in source code. Anyone with repository access can forge valid authentication tokens.',
        file: 'auth.js',
        line: 5,
        code: "const JWT_SECRET = 'mysecret123'",
        suggestedFix: 'Store secrets in environment variables and use a strong, randomly generated secret.',
        fixedCode: "const JWT_SECRET = process.env.JWT_SECRET"
      },
      {
        id: 'sec_003',
        severity: 'critical',
        type: 'hardcoded_secret',
        title: 'Hardcoded Database Credentials',
        description: 'Database password hardcoded in connection config. Credentials are exposed in version control history.',
        file: 'db.js',
        line: 6,
        code: "password: 'admin123'",
        suggestedFix: 'Use environment variables for all credentials.',
        fixedCode: "password: process.env.DB_PASSWORD"
      },
      {
        id: 'sec_004',
        severity: 'high',
        type: 'auth',
        title: 'Missing Authorization Check',
        description: 'getUser endpoint does not verify the requester has permission to access the requested user data. Any authenticated user can access any other user\'s data.',
        file: 'auth.js',
        line: 17,
        code: "async function getUser(userId) {\n  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])\n  return user\n}",
        suggestedFix: 'Add authorization middleware to verify user permissions before returning data.',
        fixedCode: "async function getUser(userId, currentUser) {\n  if (currentUser.id !== userId && !currentUser.isAdmin) {\n    throw new UnauthorizedError('Access denied')\n  }\n  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])\n  return user\n}"
      },
      {
        id: 'sec_005',
        severity: 'high',
        type: 'missing_validation',
        title: 'No Input Validation on Login',
        description: 'Username and password fields accept any input without validation. This enables injection attacks and allows malformed data into the system.',
        file: 'server.js',
        line: 12,
        code: "const { username, password } = req.body",
        suggestedFix: 'Use a validation library like Joi or Zod to validate and sanitize input before processing.',
        fixedCode: "const schema = z.object({\n  username: z.string().min(3).max(50),\n  password: z.string().min(8)\n})\nconst { username, password } = schema.parse(req.body)"
      }
    ],
    summary: {
      totalIssues: 5,
      bySeverity: { critical: 3, high: 2, medium: 0, low: 0 },
      mostVulnerableFile: 'auth.js',
      topRisk: 'SQL Injection allows complete database compromise',
      overallSecurityScore: 25
    }
  },
  documentation: `# vulnerable-express-api

## Overview

A Node.js REST API providing user authentication and data access. Built with Express.js and MySQL.

**Tech Stack:**
- Node.js 18+
- Express.js 4.x
- MySQL 8.0
- JWT for authentication

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/demo-user/vulnerable-express-api.git
cd vulnerable-express-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
\`\`\`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| \`PORT\` | Server port (default: 3000) | No |
| \`DB_HOST\` | MySQL host | Yes |
| \`DB_USER\` | MySQL username | Yes |
| \`DB_PASSWORD\` | MySQL password | Yes |
| \`DB_NAME\` | Database name | Yes |
| \`JWT_SECRET\` | Secret for signing JWTs | Yes |

## API Reference

### Authentication

#### POST /api/login

Authenticates a user and returns a JWT token.

**Request Body:**
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

**Error Response (401):**
\`\`\`json
{
  "success": false,
  "error": "Invalid credentials"
}
\`\`\`

### Users

#### GET /api/users/:id

Retrieves user data by ID. Requires authentication.

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
\`\`\`

## Project Structure

\`\`\`
├── server.js      # Express app entry point
├── auth.js        # Authentication logic
├── db.js          # Database connection
└── package.json   # Dependencies
\`\`\`

## Known Issues

> ⚠️ **Security Advisory**: The following issues were identified by the Security Specialist Agent and require immediate attention.

### [CRITICAL] SQL Injection in Login Function
- **File**: \`auth.js\` (line 9)
- **Risk**: Attackers can bypass authentication or extract database contents
- **Fix**: Use parameterized queries instead of string concatenation

### [CRITICAL] Hardcoded JWT Secret
- **File**: \`auth.js\` (line 5)
- **Risk**: Anyone with code access can forge authentication tokens
- **Fix**: Move secret to environment variables

### [CRITICAL] Hardcoded Database Credentials
- **File**: \`db.js\` (line 6)
- **Risk**: Database credentials exposed in version control
- **Fix**: Use environment variables for all credentials

### [HIGH] Missing Authorization Check
- **File**: \`auth.js\` (line 17)
- **Risk**: Users can access other users' data
- **Fix**: Implement proper authorization checks

### [HIGH] No Input Validation
- **File**: \`server.js\` (line 12)
- **Risk**: Malformed input can cause unexpected behavior
- **Fix**: Add input validation using Joi or Zod

## License

MIT`,
  documentationMeta: {
    sections: ['Overview', 'Installation', 'Environment Variables', 'API Reference', 'Project Structure', 'Known Issues', 'License'],
    wordCount: 412,
    coverageScore: 78
  },
  architecture: {
    refactors: [
      {
        id: 'arch_001',
        title: 'Implement Centralized Query Builder',
        description: 'Multiple SQL injection vulnerabilities share the same root cause: raw string interpolation in queries. A centralized database service with built-in parameterization prevents this entire class of vulnerability. Consider using an ORM like Prisma or a query builder like Knex.',
        impact: 'high',
        category: 'security',
        effort: '1 day',
        affectedFiles: ['auth.js', 'db.js'],
        beforeCode: "// auth.js\nconst query = `SELECT * FROM users WHERE id = ${userId}`\nconst result = await db.query(query)\n\n// Multiple files repeat this pattern",
        afterCode: "// db/queries.js\nimport { db } from './connection'\n\nexport const users = {\n  findById: (id) => db.query(\n    'SELECT * FROM users WHERE id = $1',\n    [id]\n  ),\n  findByUsername: (username) => db.query(\n    'SELECT * FROM users WHERE username = $1',\n    [username]\n  )\n}",
        preventsBugIds: ['sec_001']
      },
      {
        id: 'arch_002',
        title: 'Centralized Configuration Module',
        description: 'Hardcoded secrets across multiple files indicate missing config management. A single config module that validates environment variables at startup catches missing config early and provides a single source of truth.',
        impact: 'high',
        category: 'security',
        effort: '2 hours',
        affectedFiles: ['auth.js', 'db.js', 'server.js'],
        beforeCode: "// auth.js\nconst JWT_SECRET = 'mysecret123'\n\n// db.js\nconst config = {\n  host: 'localhost',\n  password: 'admin123'\n}",
        afterCode: "// config.js\nconst requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD', 'DB_HOST']\n\nfor (const envVar of requiredEnvVars) {\n  if (!process.env[envVar]) {\n    throw new Error(`Missing required env var: ${envVar}`)\n  }\n}\n\nexport const config = {\n  jwt: { secret: process.env.JWT_SECRET },\n  db: {\n    host: process.env.DB_HOST,\n    password: process.env.DB_PASSWORD\n  }\n}",
        preventsBugIds: ['sec_002', 'sec_003']
      },
      {
        id: 'arch_003',
        title: 'Add Global Error Handling Middleware',
        description: 'Scattered error handling leads to inconsistent responses and potential information leakage. Centralized middleware ensures all errors are handled uniformly with proper logging and sanitized client responses.',
        impact: 'medium',
        category: 'error-handling',
        effort: '3 hours',
        affectedFiles: ['server.js'],
        beforeCode: "app.get('/api/users/:id', async (req, res) => {\n  try {\n    const user = await getUser(req.params.id)\n    res.json(user)\n  } catch (err) {\n    console.log(err)\n    res.status(500).json({ error: err.message })\n  }\n})",
        afterCode: "// middleware/errorHandler.js\nexport const asyncHandler = (fn) => (req, res, next) =>\n  Promise.resolve(fn(req, res, next)).catch(next)\n\nexport const globalErrorHandler = (err, req, res, next) => {\n  console.error('Error:', err)\n  \n  const statusCode = err.statusCode || 500\n  const message = err.isOperational \n    ? err.message \n    : 'Internal server error'\n  \n  res.status(statusCode).json({ error: message })\n}\n\n// server.js\napp.get('/api/users/:id', asyncHandler(async (req, res) => {\n  const user = await getUser(req.params.id)\n  res.json(user)\n}))\n\napp.use(globalErrorHandler)",
        preventsBugIds: []
      },
      {
        id: 'arch_004',
        title: 'Implement Input Validation Layer',
        description: 'Add a dedicated validation layer using Zod or Joi that runs before any business logic. This creates a clear boundary between untrusted input and validated data.',
        impact: 'high',
        category: 'security',
        effort: '4 hours',
        affectedFiles: ['server.js', 'auth.js'],
        beforeCode: "app.post('/api/login', async (req, res) => {\n  const { username, password } = req.body\n  // No validation - directly used\n  const user = await login(username, password)\n})",
        afterCode: "// validation/schemas.js\nimport { z } from 'zod'\n\nexport const loginSchema = z.object({\n  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),\n  password: z.string().min(8).max(100)\n})\n\n// server.js\nimport { validate } from './middleware/validate'\nimport { loginSchema } from './validation/schemas'\n\napp.post('/api/login', \n  validate(loginSchema),\n  async (req, res) => {\n    // req.body is now validated and typed\n    const user = await login(req.body)\n  }\n)",
        preventsBugIds: ['sec_005']
      },
      {
        id: 'arch_005',
        title: 'Add Authorization Middleware',
        description: 'Implement role-based access control (RBAC) middleware that can be applied to routes requiring authorization checks.',
        impact: 'high',
        category: 'security',
        effort: '4 hours',
        affectedFiles: ['auth.js', 'server.js'],
        beforeCode: "app.get('/api/users/:id', async (req, res) => {\n  // Anyone can access any user's data\n  const user = await getUser(req.params.id)\n  res.json(user)\n})",
        afterCode: "// middleware/authorize.js\nexport const authorize = (allowSelf = false) => (req, res, next) => {\n  const targetId = req.params.id\n  const currentUser = req.user\n  \n  if (allowSelf && currentUser.id === targetId) {\n    return next()\n  }\n  \n  if (!currentUser.roles.includes('admin')) {\n    return res.status(403).json({ error: 'Forbidden' })\n  }\n  \n  next()\n}\n\n// server.js\napp.get('/api/users/:id',\n  authenticate,\n  authorize({ allowSelf: true }),\n  async (req, res) => {\n    const user = await getUser(req.params.id)\n    res.json(user)\n  }\n)",
        preventsBugIds: ['sec_004']
      }
    ],
    result: {
      overallAssessment: 'The codebase has critical security vulnerabilities that require immediate attention. The architecture lacks centralized concerns for configuration, validation, and error handling. However, the basic structure is sound and can be improved incrementally.',
      architectureScore: 35,
      biggestRisk: 'SQL injection and hardcoded credentials allow complete system compromise',
      quickWins: ['arch_002', 'arch_003'],
      patternAnalysis: {
        present: ['Express MVC', 'Async/Await', 'Modular Files'],
        missing: ['Repository Pattern', 'Dependency Injection', 'Input Validation Layer', 'Error Boundary'],
        antiPatterns: ['Hardcoded Configuration', 'Missing Error Boundaries', 'Direct SQL Concatenation', 'No Input Sanitization']
      }
    }
  },
  compilation: {
    executiveSummary: 'This Node.js API has critical security vulnerabilities that pose immediate risk of data breach. Three critical issues — SQL injection, hardcoded JWT secret, and hardcoded database credentials — require urgent remediation before any production deployment. The good news: all issues are fixable with straightforward architectural improvements.',
    codeHealthScore: 28,
    scoreBreakdown: {
      security: 25,
      documentation: 78,
      architecture: 35
    },
    topPriorityActions: [
      {
        rank: 1,
        action: 'Fix SQL injection vulnerability in auth.js',
        reason: 'Direct database compromise risk - attackers can read/modify all data',
        agent: 'security',
        effort: '30 minutes'
      },
      {
        rank: 2,
        action: 'Move all secrets to environment variables',
        reason: 'Credential exposure in source code enables unauthorized access',
        agent: 'security',
        effort: '1 hour'
      },
      {
        rank: 3,
        action: 'Implement centralized query builder',
        reason: 'Prevents entire class of injection attacks systematically',
        agent: 'architecture',
        effort: '1 day'
      }
    ],
    crossCuttingConcerns: [
      'Missing input validation at API boundary, database layer, and business logic',
      'No centralized error handling leads to inconsistent responses and info leakage',
      'Secrets management completely absent - all credentials hardcoded',
      'Authorization checks missing on sensitive endpoints'
    ],
    strengths: [
      'Clean Express.js structure with logical file separation',
      'Async/await used consistently throughout',
      'Basic API design follows REST conventions',
      'Code is readable and maintainable once security issues are fixed'
    ],
    finalVerdict: 'Critical security issues must be fixed before this code is safe to deploy. Estimated remediation time: 2-3 days for a senior developer.'
  },
  agentMessages: [
    {
      id: 'msg_001',
      from: 'coordinator',
      to: 'security',
      content: 'Starting security analysis. Focus on auth.js and db.js - they handle authentication and database access.',
      timestamp: Date.now() - 48000
    },
    {
      id: 'msg_002',
      from: 'security',
      to: 'coordinator',
      content: 'Found critical SQL injection in auth.js line 9. User input directly interpolated into query string.',
      timestamp: Date.now() - 42000
    },
    {
      id: 'msg_003',
      from: 'security',
      to: 'coordinator',
      content: 'Multiple hardcoded secrets detected. JWT secret and database password both in source code.',
      timestamp: Date.now() - 38000
    },
    {
      id: 'msg_004',
      from: 'coordinator',
      to: 'writer',
      content: 'Security found 5 issues. Include Known Issues section in documentation with all findings.',
      timestamp: Date.now() - 32000
    },
    {
      id: 'msg_005',
      from: 'writer',
      to: 'coordinator',
      content: 'Documentation complete with API reference and security warnings. 412 words, 78% coverage.',
      timestamp: Date.now() - 24000
    },
    {
      id: 'msg_006',
      from: 'coordinator',
      to: 'architecture',
      content: 'Review structure for patterns that enable these security issues. Suggest architectural fixes.',
      timestamp: Date.now() - 20000
    },
    {
      id: 'msg_007',
      from: 'architecture',
      to: 'coordinator',
      content: 'Root cause: missing centralized config, query building, and validation layers. 5 refactors suggested.',
      timestamp: Date.now() - 12000
    },
    {
      id: 'msg_008',
      from: 'coordinator',
      to: 'all',
      content: 'Analysis complete. Code health score: 28/100. Critical issues require immediate attention.',
      timestamp: Date.now() - 4000
    }
  ],
  timing: {
    startTime: Date.now() - 52000,
    endTime: Date.now(),
    durationMs: 52000
  },
  status: 'complete'
};

export const DEMO_EVENTS = [
  {
    eventName: 'pipeline_start',
    data: {
      repoUrl: 'https://github.com/demo-user/vulnerable-express-api',
      timestamp: Date.now()
    },
    delayMs: 0
  },
  {
    eventName: 'pipeline_phase',
    data: {
      phase: 'fetching',
      message: 'Cloning repository...'
    },
    delayMs: 500
  },
  {
    eventName: 'repo_ready',
    data: DEMO_RESULTS.repoSummary,
    delayMs: 2000
  },
  {
    eventName: 'session_created',
    data: {
      sessionId: DEMO_RESULTS.sessionId
    },
    delayMs: 500
  },
  {
    eventName: 'pipeline_phase',
    data: {
      phase: 'planning',
      message: 'Coordinator creating analysis plan...'
    },
    delayMs: 800
  },
  {
    eventName: 'coordinator_plan',
    data: DEMO_RESULTS.plan,
    delayMs: 2500
  },
  {
    eventName: 'pipeline_phase',
    data: {
      phase: 'analyzing',
      message: 'Agents analyzing codebase...'
    },
    delayMs: 500
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'security',
      status: 'running',
      message: 'Starting security analysis...'
    },
    delayMs: 800
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[0],
    delayMs: 1000
  },
  {
    eventName: 'agent_finding',
    data: {
      agentId: 'security',
      finding: DEMO_RESULTS.security.bugs[0]
    },
    delayMs: 1500
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[1],
    delayMs: 800
  },
  {
    eventName: 'agent_finding',
    data: {
      agentId: 'security',
      finding: DEMO_RESULTS.security.bugs[1]
    },
    delayMs: 1200
  },
  {
    eventName: 'agent_finding',
    data: {
      agentId: 'security',
      finding: DEMO_RESULTS.security.bugs[2]
    },
    delayMs: 1000
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[2],
    delayMs: 600
  },
  {
    eventName: 'agent_finding',
    data: {
      agentId: 'security',
      finding: DEMO_RESULTS.security.bugs[3]
    },
    delayMs: 1200
  },
  {
    eventName: 'agent_finding',
    data: {
      agentId: 'security',
      finding: DEMO_RESULTS.security.bugs[4]
    },
    delayMs: 1000
  },
  {
    eventName: 'security_complete',
    data: {
      bugs: DEMO_RESULTS.security.bugs,
      summary: DEMO_RESULTS.security.summary
    },
    delayMs: 800
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'security',
      status: 'complete',
      message: 'Security analysis complete'
    },
    delayMs: 500
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'writer',
      status: 'running',
      message: 'Generating documentation...'
    },
    delayMs: 800
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[3],
    delayMs: 1200
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[4],
    delayMs: 3500
  },
  {
    eventName: 'documentation_complete',
    data: {
      documentation: DEMO_RESULTS.documentation,
      meta: DEMO_RESULTS.documentationMeta
    },
    delayMs: 800
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'writer',
      status: 'complete',
      message: 'Documentation complete'
    },
    delayMs: 500
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'architecture',
      status: 'running',
      message: 'Reviewing architecture...'
    },
    delayMs: 800
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[5],
    delayMs: 1200
  },
  {
    eventName: 'agent_refactor',
    data: {
      agentId: 'architecture',
      refactor: DEMO_RESULTS.architecture.refactors[0]
    },
    delayMs: 1500
  },
  {
    eventName: 'agent_refactor',
    data: {
      agentId: 'architecture',
      refactor: DEMO_RESULTS.architecture.refactors[1]
    },
    delayMs: 1200
  },
  {
    eventName: 'agent_refactor',
    data: {
      agentId: 'architecture',
      refactor: DEMO_RESULTS.architecture.refactors[2]
    },
    delayMs: 1000
  },
  {
    eventName: 'agent_refactor',
    data: {
      agentId: 'architecture',
      refactor: DEMO_RESULTS.architecture.refactors[3]
    },
    delayMs: 1200
  },
  {
    eventName: 'agent_refactor',
    data: {
      agentId: 'architecture',
      refactor: DEMO_RESULTS.architecture.refactors[4]
    },
    delayMs: 1000
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[6],
    delayMs: 800
  },
  {
    eventName: 'architecture_complete',
    data: {
      refactors: DEMO_RESULTS.architecture.refactors,
      result: DEMO_RESULTS.architecture.result
    },
    delayMs: 800
  },
  {
    eventName: 'agent_status',
    data: {
      agentId: 'architecture',
      status: 'complete',
      message: 'Architecture review complete'
    },
    delayMs: 500
  },
  {
    eventName: 'pipeline_phase',
    data: {
      phase: 'compiling',
      message: 'Coordinator compiling results...'
    },
    delayMs: 800
  },
  {
    eventName: 'agent_communication',
    data: DEMO_RESULTS.agentMessages[7],
    delayMs: 2500
  },
  {
    eventName: 'compilation_complete',
    data: DEMO_RESULTS.compilation,
    delayMs: 1500
  },
  {
    eventName: 'session_status',
    data: {
      sessionId: DEMO_RESULTS.sessionId,
      status: 'complete'
    },
    delayMs: 500
  },
  {
    eventName: 'pipeline_phase',
    data: {
      phase: 'complete',
      message: 'Analysis complete!'
    },
    delayMs: 500
  },
  {
    eventName: 'analysis_complete',
    data: {
      sessionId: DEMO_RESULTS.sessionId,
      timing: DEMO_RESULTS.timing
    },
    delayMs: 500
  },
  {
    eventName: 'final_results',
    data: DEMO_RESULTS,
    delayMs: 500
  }
];