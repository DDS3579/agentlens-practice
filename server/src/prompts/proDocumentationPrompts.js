// server/src/prompts/proDocumentationPrompts.js

/**
 * System prompt for Pro-tier documentation generation
 * Produces industry-standard, deeply detailed documentation
 */
export const PRO_DOCS_SYSTEM_PROMPT = `You are a senior technical writer with 15 years of experience writing documentation for Fortune 500 engineering teams. You write documentation that is precise, developer-friendly, and immediately actionable. You follow the Divio documentation system (tutorials, how-to guides, reference, explanation). Your output is always structured, consistent, and production-ready. You never pad content — every sentence earns its place. You write as if onboarding a senior engineer who has zero context about this codebase.

Key principles:
- Be specific, not generic. Use actual file names, actual endpoints, actual types.
- Assume the reader is technical but unfamiliar with this specific project.
- Include code examples that actually work.
- Highlight gotchas, edge cases, and non-obvious behaviors.
- Structure information for scanability — tables, lists, and clear headings.
- When documenting APIs, include request/response examples.
- When documenting setup, include troubleshooting for common issues.`;

/**
 * Build ASCII tree from file tree data (reused from documentationPrompt.js)
 */
function buildAsciiTree(treeNodes, prefix = '') {
  if (!treeNodes || !Array.isArray(treeNodes) || treeNodes.length === 0) {
    return '';
  }

  let result = '';
  treeNodes.forEach((node, index) => {
    const isLast = index === treeNodes.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    if (node.type === 'dir' || node.type === 'directory') {
      result += `${prefix}${connector}${node.name}/\n`;
      if (node.children && node.children.length > 0) {
        result += buildAsciiTree(node.children, prefix + childPrefix);
      }
    } else {
      result += `${prefix}${connector}${node.name}\n`;
    }
  });

  return result;
}

/**
 * Get first N lines of content
 */
function getFirstLines(content, lineCount) {
  if (!content) return '';
  const lines = content.split('\n');
  return lines.slice(0, lineCount).join('\n');
}

/**
 * Check if file should be skipped (node_modules, lock files, etc.)
 */
function shouldSkipFile(filePath) {
  const skipPatterns = [
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.git/',
    'dist/',
    'build/',
    '.next/',
    '.cache/',
    '*.min.js',
    '*.min.css',
    '*.map',
  ];
  
  const pathLower = filePath.toLowerCase();
  return skipPatterns.some(pattern => {
    if (pattern.startsWith('*')) {
      return pathLower.endsWith(pattern.slice(1));
    }
    return pathLower.includes(pattern);
  });
}

/**
 * Identify file type for categorization
 */
function categorizeFile(filePath) {
  const pathLower = filePath.toLowerCase();
  
  if (pathLower.includes('route') || pathLower.includes('api/') || pathLower.includes('endpoint')) {
    return 'api';
  }
  if (pathLower.includes('model') || pathLower.includes('schema') || pathLower.includes('types')) {
    return 'model';
  }
  if (pathLower.includes('.env') || pathLower.includes('config')) {
    return 'config';
  }
  if (pathLower.includes('component') || pathLower.endsWith('.jsx') || pathLower.endsWith('.tsx')) {
    return 'component';
  }
  if (pathLower.includes('test') || pathLower.includes('spec')) {
    return 'test';
  }
  return 'other';
}

/**
 * Build the Pro Documentation prompt
 * 
 * @param {Object} repoData - { files, repoSummary }
 * @param {Object} plan - Coordinator's plan
 * @param {Object} archResult - Architecture agent results
 * @param {Object} secResult - Security agent results
 * @param {Object} fileTreeData - File tree structure
 * @param {Object} llmConfig - LLM configuration
 * @returns {string} Complete prompt
 */
export function buildProDocumentationPrompt(
  repoData,
  plan,
  archResult,
  secResult,
  fileTreeData,
  llmConfig
) {
  const files = repoData?.files || [];
  const repoSummary = repoData?.repoSummary || {};
  
  let prompt = '';

  // ============================================
  // HEADER
  // ============================================
  prompt += `# Professional Documentation Generation Task

You are generating comprehensive, production-ready documentation for the following repository.

## Repository Information
- **Owner**: ${repoSummary.owner || 'unknown'}
- **Name**: ${repoSummary.repo || 'unknown'}
- **Branch**: ${repoSummary.branch || 'main'}
- **Total Files**: ${files.length}

`;

  // ============================================
  // FILE TREE
  // ============================================
  if (fileTreeData?.tree) {
    const asciiTree = buildAsciiTree(fileTreeData.tree);
    prompt += `## Project Structure

\`\`\`
${fileTreeData.name || 'project'}/
${asciiTree}\`\`\`

`;
  }

  // ============================================
  // ARCHITECTURE INSIGHTS
  // ============================================
  if (archResult) {
    const archSummary = archResult.summary || archResult.description || 
                        archResult.architectureSummary || '';
    if (archSummary) {
      prompt += `## Architecture Analysis Results

${archSummary.substring(0, 800)}

`;
    }
    
    if (archResult.patterns) {
      prompt += `### Detected Patterns
${JSON.stringify(archResult.patterns, null, 2).substring(0, 500)}

`;
    }
  }

  // ============================================
  // SECURITY FINDINGS
  // ============================================
  if (secResult) {
    const issues = secResult.issues || secResult.bugs || secResult.vulnerabilities || [];
    if (issues.length > 0) {
      prompt += `## Security Analysis Results

The security agent identified ${issues.length} issue(s):

`;
      issues.slice(0, 10).forEach((issue, i) => {
        prompt += `${i + 1}. **[${issue.severity || 'medium'}]** ${issue.title || issue.message || 'Issue'}\n`;
        prompt += `   - File: ${issue.file || 'N/A'}\n`;
        prompt += `   - Description: ${(issue.description || '').substring(0, 150)}\n`;
        if (issue.suggestedFix) {
          prompt += `   - Suggested Fix: ${issue.suggestedFix.substring(0, 100)}\n`;
        }
        prompt += '\n';
      });
    }
  }

  // ============================================
  // COORDINATOR PLAN
  // ============================================
  if (plan) {
    const planSummary = plan.summary || plan.planSummary || '';
    if (planSummary) {
      prompt += `## Analysis Plan Summary

${planSummary.substring(0, 400)}

`;
    }
  }

  // ============================================
  // FILE CONTENTS (categorized)
  // ============================================
  prompt += `## Source Files

`;

  // Categorize files
  const categorizedFiles = {
    api: [],
    model: [],
    config: [],
    component: [],
    other: []
  };

  files.forEach(file => {
    if (!shouldSkipFile(file.path)) {
      const category = categorizeFile(file.path);
      categorizedFiles[category].push(file);
    }
  });

  // Add API/Route files first (important for api_reference section)
  if (categorizedFiles.api.length > 0) {
    prompt += `### API/Route Files\n\n`;
    categorizedFiles.api.slice(0, 10).forEach(file => {
      const content = getFirstLines(file.content || '', 80);
      prompt += `#### \`${file.path}\`\n\`\`\`${file.language || ''}\n${content}\n\`\`\`\n\n`;
    });
  }

  // Add Model/Schema files (important for data_models section)
  if (categorizedFiles.model.length > 0) {
    prompt += `### Model/Schema Files\n\n`;
    categorizedFiles.model.slice(0, 10).forEach(file => {
      const content = getFirstLines(file.content || '', 80);
      prompt += `#### \`${file.path}\`\n\`\`\`${file.language || ''}\n${content}\n\`\`\`\n\n`;
    });
  }

  // Add Config files (important for setup_guide section)
  if (categorizedFiles.config.length > 0) {
    prompt += `### Configuration Files\n\n`;
    categorizedFiles.config.slice(0, 5).forEach(file => {
      const content = getFirstLines(file.content || '', 60);
      prompt += `#### \`${file.path}\`\n\`\`\`${file.language || ''}\n${content}\n\`\`\`\n\n`;
    });
  }

  // Add key component files
  if (categorizedFiles.component.length > 0) {
    prompt += `### Key Component Files\n\n`;
    categorizedFiles.component.slice(0, 8).forEach(file => {
      const content = getFirstLines(file.content || '', 60);
      prompt += `#### \`${file.path}\`\n\`\`\`${file.language || ''}\n${content}\n\`\`\`\n\n`;
    });
  }

  // Add a few other important files
  const otherImportant = categorizedFiles.other
    .filter(f => {
      const name = f.path.toLowerCase();
      return name.includes('readme') || name.includes('package.json') || 
             name.includes('index') || name.includes('main') || name.includes('app');
    })
    .slice(0, 5);

  if (otherImportant.length > 0) {
    prompt += `### Other Key Files\n\n`;
    otherImportant.forEach(file => {
      const content = getFirstLines(file.content || '', 80);
      prompt += `#### \`${file.path}\`\n\`\`\`${file.language || ''}\n${content}\n\`\`\`\n\n`;
    });
  }

  // ============================================
  // OUTPUT INSTRUCTIONS
  // ============================================
  prompt += `---

# YOUR OUTPUT

Generate comprehensive documentation as a JSON object with the following exact structure.

**CRITICAL INSTRUCTIONS:**
- Output ONLY valid JSON. No markdown fences. No explanation. No preamble.
- Start your response with \`{\` and end with \`}\`
- Base \`api_reference\` on actual route files found above
- Base \`data_models\` on actual schema/model files found above
- Base \`envVars\` on any .env.example or config files found above
- If a section has no relevant data, use empty arrays or placeholder text
- All string values must be properly escaped for JSON

## Required JSON Structure:

{
  "overview": {
    "summary": "2-3 paragraph executive summary of what this project does, its goals, and its value proposition",
    "purpose": "One sentence describing the primary purpose",
    "techStack": [
      { "name": "Technology Name", "version": "version or N/A", "purpose": "What it's used for" }
    ],
    "quickStart": "Single bash command or short snippet to run the project"
  },
  "architecture": {
    "summary": "3-4 paragraphs explaining the system design, architectural style (monolith, microservices, etc.), and how components interact",
    "dataFlow": "Step by step description of how data flows through the main use case (e.g., user submits form -> API validates -> DB stores -> response returned)",
    "keyDecisions": [
      { "decision": "What was decided", "rationale": "Why this choice was made", "tradeoffs": "What was sacrificed or gained" }
    ],
    "diagramDescription": "Text description of what an architecture diagram would show - boxes, arrows, connections between services"
  },
  "api_reference": {
    "baseUrl": "e.g., /api or http://localhost:3000/api",
    "authentication": "Description of auth mechanism (JWT, session, API key, none)",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/api/endpoint",
        "description": "What this endpoint does",
        "params": [
          { "name": "paramName", "type": "string|number|boolean|object", "required": true, "description": "What this param is for" }
        ],
        "response": "{ example: 'response shape' }",
        "example": "curl -X POST http://localhost:3000/api/endpoint -d '{...}'"
      }
    ]
  },
  "data_models": {
    "models": [
      {
        "name": "ModelName",
        "description": "What this model represents",
        "fields": [
          { "name": "fieldName", "type": "string|number|Date|etc", "description": "Field purpose" }
        ],
        "relationships": "Description of how this model relates to others"
      }
    ]
  },
  "security": {
    "authModel": "Detailed description of authentication and authorization approach",
    "vulnerabilities": [
      { "severity": "high|medium|low", "description": "Issue description", "recommendation": "How to fix it" }
    ],
    "bestPractices": ["Security best practice 1", "Security best practice 2"]
  },
  "setup_guide": {
    "prerequisites": [
      { "tool": "Node.js", "version": ">=18", "installUrl": "https://nodejs.org" }
    ],
    "envVars": [
      { "key": "ENV_VAR_NAME", "required": true, "description": "What this var does", "example": "example_value" }
    ],
    "steps": [
      "git clone <repo-url>",
      "cd project-name",
      "npm install",
      "cp .env.example .env",
      "npm run dev"
    ],
    "troubleshooting": [
      { "problem": "Common problem description", "solution": "How to solve it" }
    ]
  },
  "developer_guide": {
    "conventions": ["Coding convention 1", "Naming convention 2"],
    "folderRationale": "Explanation of why the folder structure is organized the way it is",
    "addingFeatures": "Step by step guide: 1. Create file in X, 2. Add route, 3. Update types, etc.",
    "testingApproach": "How to write tests, run tests, what testing frameworks are used"
  },
  "changelog_template": {
    "version": "1.0.0",
    "date": "${new Date().toISOString().split('T')[0]}",
    "added": ["Feature or capability that was added"],
    "fixed": ["Bug that was fixed based on security analysis"],
    "security": ["Security improvement based on findings"]
  }
}

Now generate the documentation JSON:`;

  return prompt;
}

export default {
  PRO_DOCS_SYSTEM_PROMPT,
  buildProDocumentationPrompt,
};