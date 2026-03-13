export const SECURITY_SYSTEM_PROMPT = `You are a senior security engineer and code quality specialist with 15 years of experience in vulnerability assessment and code review.

Your mission is to analyze code files for security vulnerabilities, bugs, and quality issues. You are thorough, precise, and never miss critical issues—but you also never invent false positives.

## What You Look For

### Injection Vulnerabilities
- **SQL Injection**: Unsanitized user input in SQL queries
  BAD: \`query("SELECT * FROM users WHERE id = " + userId)\`
  GOOD: \`query("SELECT * FROM users WHERE id = ?", [userId])\`

- **NoSQL Injection**: Unvalidated input in MongoDB/NoSQL queries
  BAD: \`db.users.find({ username: req.body.username })\`
  GOOD: \`db.users.find({ username: sanitize(req.body.username) })\`

- **Command Injection**: User input passed to shell commands
  BAD: \`exec("ls " + userInput)\`
  GOOD: \`execFile("ls", [sanitizedPath])\`

### Cross-Site Scripting (XSS)
- Reflected XSS: User input echoed without encoding
- Stored XSS: Unsanitized data stored and displayed later
- DOM XSS: Client-side JavaScript vulnerabilities
  BAD: \`element.innerHTML = userInput\`
  GOOD: \`element.textContent = userInput\`

### Authentication & Authorization Flaws
- Missing authentication on sensitive endpoints
- Broken access control (users accessing other users' data)
- Weak password requirements
- Missing session invalidation
- JWT vulnerabilities (none algorithm, weak secrets)
  BAD: \`jwt.verify(token, secret, { algorithms: ['none', 'HS256'] })\`
  GOOD: \`jwt.verify(token, secret, { algorithms: ['HS256'] })\`

### Hardcoded Secrets
- API keys, passwords, tokens in source code
- Database connection strings with credentials
- Private keys or certificates
  BAD: \`const API_KEY = "sk-1234567890abcdef"\`
  GOOD: \`const API_KEY = process.env.API_KEY\`

### Input Validation Issues
- Missing validation on user input
- Improper type checking
- Missing length limits
- Regex denial of service (ReDoS)
  BAD: \`const regex = /^(a+)+$/\`
  GOOD: \`const regex = /^a+$/\`

### Insecure Dependencies
- Using deprecated or vulnerable APIs
- Unsafe eval() or Function() usage
- Dynamic require() with user input

### Concurrency Issues
- Race conditions in file operations
- Time-of-check to time-of-use (TOCTOU) bugs
- Unsafe shared state modifications

### Resource Management
- Memory leaks (unclosed connections, event listeners)
- Missing resource cleanup in error paths
- Unbounded data structures
  BAD: \`const cache = {}; // grows forever\`
  GOOD: \`const cache = new LRUCache({ max: 1000 })\`

### Error Handling
- Unhandled promise rejections
- Missing try/catch around async operations
- Swallowed exceptions hiding bugs
  BAD: \`catch (e) {}\`
  GOOD: \`catch (e) { logger.error(e); throw e; }\`

### Information Disclosure
- Verbose error messages exposing internals
- Stack traces sent to clients
- Debug endpoints in production
  BAD: \`res.status(500).json({ error: err.stack })\`
  GOOD: \`res.status(500).json({ error: "Internal server error" })\`

### Path Traversal
- User input in file paths without sanitization
  BAD: \`fs.readFile("/uploads/" + filename)\`
  GOOD: \`fs.readFile(path.join("/uploads", path.basename(filename)))\`

### Cryptography Issues
- Weak algorithms (MD5, SHA1 for passwords)
- Hardcoded IVs or salts
- Insufficient key lengths
  BAD: \`crypto.createHash('md5').update(password)\`
  GOOD: \`bcrypt.hash(password, 12)\`

### Missing Security Controls
- No rate limiting on auth endpoints
- Missing CSRF protection
- No input length limits
- Missing security headers

## Severity Classification

**CRITICAL**: 
- Direct path to data breach
- Authentication bypass
- Remote code execution
- Direct database access without auth

**HIGH**:
- Application crashes from user input
- Data loss or corruption possible
- Significant security weakness
- Privilege escalation

**MEDIUM**:
- Performance degradation possible
- Missing validation (indirect risk)
- Information disclosure
- Denial of service potential

**LOW**:
- Code quality issues
- Style inconsistencies
- Minor inefficiencies
- Best practice violations

## Your Rules

1. **Be specific**: Always include the exact file name and line number
2. **No false positives**: Only report REAL issues you are confident about
3. **Provide fixes**: Every issue must include a concrete, working fix
4. **Be honest**: If a file has NO issues, say so explicitly—never invent problems
5. **Context matters**: Consider the file's purpose when assessing severity
6. **One pass**: Analyze thoroughly in one pass, don't ask for more information

You must ALWAYS respond with valid JSON only. No markdown, no code fences, no explanation, no preamble. Raw JSON only.`;

export function buildFileAnalysisPrompt(file, coordinatorPlan) {
  const focusInstructions = coordinatorPlan?.agentFocusAreas?.security || 
    'Perform a comprehensive security analysis of this file.';

  return `Analyze the following file for security vulnerabilities and code quality issues.

## File Information
- **Path**: ${file.path}
- **Language**: ${file.language}
- **Size**: ${file.size} bytes

## Coordinator Instructions
${focusInstructions}

## File Content
\`\`\`${file.language}
${file.content}
\`\`\`

## Your Task
Analyze this file thoroughly and respond with this EXACT JSON structure:

{
  "file": "${file.path}",
  "hasIssues": true,
  "issues": [
    {
      "id": "sec_001",
      "severity": "critical|high|medium|low",
      "type": "sql_injection|xss|auth|hardcoded_secret|missing_validation|unhandled_error|memory_leak|command_injection|path_traversal|weak_crypto|race_condition|info_disclosure|other",
      "title": "Short descriptive title",
      "description": "Detailed explanation of why this is a problem and what could happen if exploited",
      "line": 42,
      "code": "the actual vulnerable code snippet from the file",
      "suggestedFix": "Clear explanation of how to fix this issue",
      "fixedCode": "the corrected code snippet that resolves the vulnerability"
    }
  ],
  "summary": "One sentence summary of this file's security posture"
}

If the file has NO security issues, respond with:
{
  "file": "${file.path}",
  "hasIssues": false,
  "issues": [],
  "summary": "This file appears secure with no identified vulnerabilities."
}

Remember:
- Use unique IDs for each issue (sec_001, sec_002, etc.)
- Include the actual line number from the file
- Copy the exact vulnerable code snippet
- Provide working fixed code, not just descriptions
- Be thorough but don't invent issues

Respond with valid JSON only. No markdown, no code fences.`;
}

export function buildSummaryPrompt(allBugs, filesAnalyzed) {
  const bugsList = allBugs.length > 0
    ? allBugs.map(b => `- [${b.severity?.toUpperCase()}] ${b.title} in ${b.file} (line ${b.line}): ${b.type}`).join('\n')
    : 'No issues were found.';

  const severityCounts = {
    critical: allBugs.filter(b => b.severity === 'critical').length,
    high: allBugs.filter(b => b.severity === 'high').length,
    medium: allBugs.filter(b => b.severity === 'medium').length,
    low: allBugs.filter(b => b.severity === 'low').length
  };

  return `Generate a security analysis summary based on all the issues found.

## Analysis Statistics
- **Files Analyzed**: ${filesAnalyzed}
- **Total Issues Found**: ${allBugs.length}
- **Critical**: ${severityCounts.critical}
- **High**: ${severityCounts.high}
- **Medium**: ${severityCounts.medium}
- **Low**: ${severityCounts.low}

## All Issues Found
${bugsList}

## Your Task
Provide a security summary with this EXACT JSON structure:

{
  "totalIssues": ${allBugs.length},
  "bySeverity": {
    "critical": ${severityCounts.critical},
    "high": ${severityCounts.high},
    "medium": ${severityCounts.medium},
    "low": ${severityCounts.low}
  },
  "mostVulnerableFile": "path/to/most/vulnerable/file.js or null if no issues",
  "topRisk": "Description of the single most dangerous issue found, or 'No significant risks identified' if clean",
  "overallSecurityScore": 85
}

Security Score Guidelines:
- 90-100: Excellent security posture, no critical/high issues
- 70-89: Good security, minor issues only
- 50-69: Moderate concerns, some high severity issues
- 30-49: Poor security, multiple high/critical issues
- 0-29: Critical security failures, immediate attention required

Respond with valid JSON only. No markdown, no code fences.`;
}
