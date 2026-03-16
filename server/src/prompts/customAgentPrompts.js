// server/src/prompts/customAgentPrompts.js

/**
 * System prompt for the Custom Instruction Agent
 * This agent takes user-defined instructions and applies them across the codebase
 */
export const CUSTOM_AGENT_SYSTEM_PROMPT = `You are an expert software engineer with deep knowledge of modern software architecture, design patterns, and best practices. You are given a codebase and a specific instruction to implement. You analyze the entire codebase context, understand the existing patterns, and produce precise file edits that implement the instruction faithfully.

You always:
- Preserve existing code style and conventions
- Make minimal necessary changes to achieve the goal
- Explain each edit briefly before making it
- Output edits in a strict JSON format
- Consider security and performance implications
- Handle edge cases the original code may have missed
- Maintain backward compatibility where possible
- Follow the language-specific best practices (e.g., React patterns for JSX, Node.js patterns for backend)
- Ensure imports and exports are correctly updated
- Add necessary type annotations if TypeScript is being used

You never:
- Make unnecessary changes unrelated to the instruction
- Remove comments or documentation unless specifically asked
- Change formatting unless it's part of the instruction
- Break existing functionality
- Introduce security vulnerabilities`;

/**
 * Check if a file is relevant to the custom prompt based on keyword matching
 * @param {Object} file - File object with path and content
 * @param {string} customPrompt - User's custom instruction
 * @returns {boolean}
 */
function isFileRelevant(file, customPrompt) {
  if (!customPrompt || !file) return false;
  
  const promptLower = customPrompt.toLowerCase();
  const pathLower = (file.path || '').toLowerCase();
  const contentPreview = (file.content || '').substring(0, 100).toLowerCase();
  
  // Extract meaningful words (length > 3) from the prompt
  const keywords = promptLower
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['with', 'that', 'this', 'from', 'have', 'will', 'would', 'could', 'should'].includes(word));
  
  // Check if any keyword appears in file path or content preview
  return keywords.some(word => 
    pathLower.includes(word) || contentPreview.includes(word)
  );
}

/**
 * Format file size for display
 * @param {number} size - Size in bytes
 * @returns {string}
 */
function formatFileSize(size) {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncate text to a maximum length
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get first N lines of content
 * @param {string} content 
 * @param {number} lineCount 
 * @returns {string}
 */
function getFirstLines(content, lineCount) {
  if (!content) return '';
  const lines = content.split('\n');
  return lines.slice(0, lineCount).join('\n');
}

/**
 * Build the complete prompt for the Custom Agent
 * 
 * @param {Object} repoData - Repository data { files, repoSummary }
 * @param {Object} plan - Coordinator's execution plan
 * @param {Object} archResult - Architecture agent results
 * @param {Object} secResult - Security agent results
 * @param {string} customPrompt - User's custom instruction
 * @param {Object} fileContents - Map of file path to content (optional override)
 * @returns {string} Complete prompt string
 */
export function buildCustomAgentPrompt(
  repoData,
  plan,
  archResult,
  secResult,
  customPrompt,
  fileContents = null
) {
  const files = repoData?.files || [];
  const repoSummary = repoData?.repoSummary || {};
  
  // Enforce character limit on custom prompt
  const safePrompt = (customPrompt || '').slice(0, 500);
  
  let prompt = '';

  // ============================================
  // SECTION 1 — User Instruction (Prominent)
  // ============================================
  prompt += `# YOUR TASK

## User Instruction
"""
${safePrompt}
"""

Apply this instruction to the codebase. Make all necessary edits to implement it correctly.

---

`;

  // ============================================
  // SECTION 2 — Coordinator's Plan Summary
  // ============================================
  if (plan) {
    const planSummary = plan.summary || plan.planSummary || plan.description || '';
    prompt += `# CONTEXT

## Coordinator's Analysis Plan
${truncate(planSummary, 500)}

`;
  }

  // ============================================
  // SECTION 3 — Architecture Insights
  // ============================================
  if (archResult) {
    const archSummary = archResult.summary || archResult.description || 
                        archResult.architectureSummary || '';
    if (archSummary) {
      prompt += `## Architecture Insights
${truncate(archSummary, 300)}

`;
    }
  }

  // ============================================
  // SECTION 4 — Security Issues to Be Aware Of
  // ============================================
  if (secResult) {
    const issues = secResult.issues || secResult.bugs || secResult.vulnerabilities || [];
    if (issues.length > 0) {
      prompt += `## Security Issues to Consider
When making changes, be aware of these existing security concerns:

`;
      // Show first 5 issues only
      issues.slice(0, 5).forEach((issue, index) => {
        const title = issue.title || issue.message || issue.type || 'Security issue';
        const severity = issue.severity || 'medium';
        const file = issue.file || issue.location || '';
        prompt += `- **${title}** [${severity}]${file ? ` in \`${file}\`` : ''}\n`;
      });
      
      if (issues.length > 5) {
        prompt += `- ... and ${issues.length - 5} more issues\n`;
      }
      prompt += '\n';
    }
  }

  // ============================================
  // SECTION 5 — Repository File List
  // ============================================
  prompt += `## Repository Structure
Repository: ${repoSummary.owner || 'unknown'}/${repoSummary.repo || 'unknown'}
Total Files: ${files.length}

File List:
`;

  files.forEach(file => {
    const size = formatFileSize(file.size || file.content?.length || 0);
    prompt += `- \`${file.path}\` (${size})\n`;
  });

  prompt += '\n';

  // ============================================
  // SECTION 6 — File Contents
  // ============================================
  prompt += `## File Contents

`;

  files.forEach(file => {
    const content = fileContents?.[file.path] || file.content || '';
    const isRelevant = isFileRelevant(file, safePrompt);
    
    if (isRelevant) {
      // Include full content for relevant files
      prompt += `### File: \`${file.path}\`
\`\`\`${file.language || ''}
${content}
\`\`\`

`;
    } else {
      // Include only first 50 lines for non-relevant files
      const preview = getFirstLines(content, 50);
      const lineCount = content.split('\n').length;
      
      prompt += `### File: \`${file.path}\` (preview - ${lineCount} total lines)
\`\`\`${file.language || ''}
${preview}
\`\`\`
${lineCount > 50 ? `... (${lineCount - 50} more lines)\n` : ''}
`;
    }
  });

  // ============================================
  // SECTION 7 — Output Format Instructions
  // ============================================
  prompt += `---

# OUTPUT FORMAT

Respond with a JSON array of edits. Each edit object must have this exact structure:

\`\`\`json
[
  {
    "file": "src/components/Auth.jsx",
    "lineStart": 14,
    "lineEnd": 18,
    "newContent": "  const { user } = useUser();\\n  if (!user) return null;",
    "editType": "replace",
    "explanation": "Brief reason for this change"
  }
]
\`\`\`

**Edit Types:**
- \`"replace"\` - Replace lines lineStart through lineEnd with newContent
- \`"insert"\` - Insert newContent before lineStart (lineEnd is ignored)
- \`"delete"\` - Delete lines lineStart through lineEnd (newContent is ignored)

**Rules:**
1. Line numbers are 1-indexed
2. Output ONLY the JSON array - no markdown fences, no preamble, no explanation outside the JSON
3. Each edit's newContent should be properly escaped for JSON (\\n for newlines, \\" for quotes)
4. Keep explanations brief (under 100 characters)
5. Order edits by file, then by lineStart ascending
6. If no changes are needed, return an empty array: []

Now analyze the codebase and generate the edits to implement the user's instruction.`;

  return prompt;
}

export default {
  CUSTOM_AGENT_SYSTEM_PROMPT,
  buildCustomAgentPrompt,
};