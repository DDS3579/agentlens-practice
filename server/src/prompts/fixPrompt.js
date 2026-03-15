
// server/src/prompts/fixPrompt.js

/**
 * System prompt for the fix agent LLM
 */
export const FIX_AGENT_SYSTEM_PROMPT = `You are a precise code fix agent. Your ONLY job is to fix security vulnerabilities and bugs in code files.

Rules:
1. Return the COMPLETE fixed file content — never partial, never truncated
2. Preserve all existing functionality — only change what is needed to fix the bug
3. Keep all imports, exports, comments, and code structure intact
4. Do NOT add explanations, markdown, or code fences — return raw code only
5. Fix ONLY the specified vulnerability — do not refactor unrelated code
6. If the fix requires new imports, add them at the top
7. Maintain the exact same coding style as the original`;

/**
 * Builds the user prompt for fixing a single bug in a file
 * @param {Object} bug - Bug object with shape: { id, file, line, type, severity, description, vulnerableCode, suggestedFix, fixedCode }
 * @param {string} fileContent - Full current file content
 * @returns {string} The formatted prompt for the LLM
 */
export function buildFixPrompt(bug, fileContent) {
  const lineCount = fileContent ? fileContent.split('\n').length : 0;
  
  return `FILE: ${bug.file}
TOTAL LINES: ${lineCount}

BUG TO FIX:
- Type: ${bug.type}
- Severity: ${bug.severity}
- Line: ${bug.line}
- Description: ${bug.description}
- Vulnerable code: ${bug.vulnerableCode || 'N/A'}
- Suggested fix: ${bug.suggestedFix || 'N/A'}

CURRENT FILE CONTENT:
${fileContent}

Return the complete fixed file. Raw code only. No markdown.`;
}

/**
 * Builds prompt for fixing multiple bugs in the same file in one pass
 * @param {Array} bugs - Array of bug objects for the same file
 * @param {string} fileContent - Full current file content
 * @returns {string} The formatted prompt for the LLM
 */
export function buildMultiFixPrompt(bugs, fileContent) {
  const lineCount = fileContent ? fileContent.split('\n').length : 0;
  const fileName = bugs.length > 0 ? bugs[0].file : 'unknown';
  
  let bugsList = bugs.map((bug, index) => {
    return `${index + 1}. Type: ${bug.type}
   Severity: ${bug.severity}
   Line: ${bug.line}
   Description: ${bug.description}
   Vulnerable code: ${bug.vulnerableCode || 'N/A'}
   Suggested fix: ${bug.suggestedFix || 'N/A'}`;
  }).join('\n\n');

  return `FILE: ${fileName}
TOTAL LINES: ${lineCount}

BUGS TO FIX (${bugs.length} total):

${bugsList}

CURRENT FILE CONTENT:
${fileContent}

Return the complete fixed file with ALL bugs fixed. Raw code only. No markdown.`;
}

/**
 * Validates that the LLM response looks like valid fixed code
 * @param {string} originalContent - The original file content
 * @param {string} fixedContent - The LLM's fixed content response
 * @param {Object} bug - The bug object that was being fixed
 * @returns {{ valid: boolean, reason: string }} Validation result
 */
export function validateFixResponse(originalContent, fixedContent, bug) {
  // Check if fixedContent is empty or undefined
  if (!fixedContent || fixedContent.trim() === '') {
    return {
      valid: false,
      reason: 'Fixed content is empty or undefined'
    };
  }

  // Check if fixedContent is identical to originalContent (nothing was changed)
  if (fixedContent === originalContent) {
    return {
      valid: false,
      reason: 'Fixed content is identical to original — no changes were made'
    };
  }

  // Check if fixedContent is less than 30% the length of original (likely truncated)
  const originalLength = originalContent ? originalContent.length : 0;
  const fixedLength = fixedContent.length;
  
  if (originalLength > 0 && fixedLength < originalLength * 0.3) {
    return {
      valid: false,
      reason: `Fixed content is only ${Math.round((fixedLength / originalLength) * 100)}% of original length — likely truncated`
    };
  }

  // Check if fixedContent contains markdown fences
  if (fixedContent.includes('```')) {
    return {
      valid: false,
      reason: 'Fixed content contains markdown code fences — expected raw code only'
    };
  }

  // All checks passed
  return {
    valid: true,
    reason: 'Fixed content passed all validation checks'
  };
}
