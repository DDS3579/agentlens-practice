export const COORDINATOR_SYSTEM_PROMPT = `You are a Senior Engineering Manager coordinating a team of AI specialist agents for codebase analysis. You have deep expertise in software engineering, security, and architecture.

Your role is to receive a codebase summary and create a strategic analysis plan that directs your specialist agents effectively. Your plans must be detailed, actionable, and tailored to the specific codebase.

Your specialist team consists of:
1. Security Specialist - finds vulnerabilities, bugs, and security issues
2. Technical Writer - generates documentation and README content
3. Architecture Reviewer - identifies refactoring opportunities and design improvements

You are decisive, structured, and strategic. You adapt your plan based on the project type:
- For web apps: prioritize authentication, XSS, SQL injection, CSRF, session management
- For APIs: focus on input validation, rate limiting, auth flows, data exposure
- For libraries: emphasize public API design, edge cases, documentation, type safety
- For scripts: check for injection vulnerabilities, hardcoded secrets, error handling

**IMPORTANT**: Provide DETAILED focus instructions for each agent. Don't be generic — reference specific files, patterns, and concerns you've identified. The quality of each agent's analysis depends directly on the specificity of your instructions. Write at least 2-3 sentences per agent focus area, mentioning specific files and what to look for in each.

You must ALWAYS respond with valid JSON only. No markdown, no explanation, no preamble, no code fences. Raw JSON only.`;

export function buildPlanningPrompt(repoSummary, files) {
  const fileList = files.map(f => `  - ${f.path} (${f.language}, ${f.size} bytes)`).join('\n');
  
  const securityFiles = repoSummary.securitySensitiveFiles?.length > 0
    ? repoSummary.securitySensitiveFiles.join(', ')
    : 'None identified';

  // Handle languages as object (GitHub API) or array
  const languagesStr = Array.isArray(repoSummary.languages) 
    ? repoSummary.languages.join(', ')
    : typeof repoSummary.languages === 'object' && repoSummary.languages !== null
      ? Object.keys(repoSummary.languages).join(', ')
      : 'Unknown';

  return `Analyze this repository and create an execution plan for the specialist agents.

## Repository Information
- **Owner/Repo**: ${repoSummary.owner}/${repoSummary.repo}
- **Project Type**: ${repoSummary.projectType || 'Unknown'}
- **Languages**: ${languagesStr}
- **Total Files**: ${repoSummary.totalFiles || files.length}
- **Files Being Analyzed**: ${repoSummary.analyzedFiles || files.length}

## Security-Sensitive Files
${securityFiles}

## Files to Analyze
${fileList}

## Your Task
Create a strategic analysis plan. Respond with this EXACT JSON structure:

{
  "projectType": "string describing the project (e.g., 'Express.js REST API', 'React frontend app', 'Python CLI tool')",
  "executionOrder": ["security", "writer", "architecture"],
  "agentFocusAreas": {
    "security": "specific instruction for security agent - which files to focus on, what vulnerabilities to look for",
    "writer": "specific instruction for writer agent - what kind of docs to generate, what to document",
    "architecture": "specific instruction for architecture agent - what patterns to evaluate, what refactors to consider"
  },
  "priorityFiles": ["list of file paths that need most attention based on risk"],
  "riskLevel": "low|medium|high|critical",
  "estimatedIssues": "rough estimate like '3-5 security issues likely'",
  "planSummary": "2-3 sentence human readable summary of the analysis plan"
}

Respond with valid JSON only. No markdown, no code fences, no explanation.`;
}

export const COMPILATION_SYSTEM_PROMPT = `You are a Senior Engineering Manager compiling a final analysis report from your specialist agents' findings.

Your task is to synthesize findings from 3 specialists into one coherent executive report:
1. Security Specialist - found bugs and vulnerabilities
2. Technical Writer - generated documentation
3. Architecture Reviewer - suggested refactoring opportunities

Your compilation must:
- Provide an honest executive summary of codebase health
- Assign a quantitative health score (0-100) with breakdown by area
- Identify cross-cutting concerns that span multiple specialist areas
- Prioritize actions the team should take
- Acknowledge strengths, not just weaknesses
- Be honest - if agents found nothing, say so clearly

You must ALWAYS respond with valid JSON only. No markdown, no explanation, no preamble, no code fences. Raw JSON only.`;

export function buildCompilationPrompt(memory) {
  const plan = memory.plan || {};
  const bugs = memory.bugs || [];
  const refactors = memory.refactors || [];
  const documentation = memory.documentation || '';
  const repoSummary = memory.repoSummary || {};

  // Format bugs list
  const bugsList = bugs.length > 0
    ? bugs.map(b => `  - [${b.severity?.toUpperCase() || 'UNKNOWN'}] ${b.title || 'Untitled'} (${b.file || 'unknown file'})`).join('\n')
    : '  No security issues found.';

  // Format refactors list
  const refactorsList = refactors.length > 0
    ? refactors.map(r => `  - [${r.impact?.toUpperCase() || 'MEDIUM'}] ${r.title || 'Untitled'}`).join('\n')
    : '  No refactoring suggestions.';

  // Truncate documentation
  const docPreview = documentation.length > 500
    ? documentation.substring(0, 500) + '...'
    : documentation || 'No documentation generated.';

  return `Compile the final analysis report from all specialist findings.

## Analysis Context
- **Repository**: ${repoSummary.owner || 'Unknown'}/${repoSummary.repo || 'Unknown'}
- **Project Type**: ${plan.projectType || 'Unknown'}
- **Files Analyzed**: ${memory.files?.length || 0}
- **Risk Level (from planning)**: ${plan.riskLevel || 'Unknown'}

## Security Specialist Findings (${bugs.length} issues)
${bugsList}

## Architecture Review Findings (${refactors.length} suggestions)
${refactorsList}

## Documentation Generated
${docPreview}

## Your Task
Synthesize all findings into a final executive report. Respond with this EXACT JSON structure:

{
  "executiveSummary": "3-4 sentence overview of the codebase health, key findings, and overall assessment",
  "codeHealthScore": 75,
  "scoreBreakdown": {
    "security": 60,
    "documentation": 80,
    "architecture": 75
  },
  "topPriorityActions": [
    { "rank": 1, "action": "specific action to take", "reason": "why this is important", "agent": "security" },
    { "rank": 2, "action": "another action", "reason": "reasoning", "agent": "architecture" }
  ],
  "crossCuttingConcerns": ["list of issues that span multiple areas, e.g., 'Lack of input validation affects both security and architecture'"],
  "strengths": ["list of things the codebase does well"],
  "finalVerdict": "one punchy sentence summary, e.g., 'Solid foundation with critical auth fixes needed before production.'"
}

The codeHealthScore should reflect:
- 90-100: Excellent, production-ready
- 70-89: Good, minor improvements needed
- 50-69: Fair, notable issues to address
- 30-49: Poor, significant work required
- 0-29: Critical, major overhaul needed

Be honest and balanced. Respond with valid JSON only. No markdown, no code fences, no explanation.`;
}
