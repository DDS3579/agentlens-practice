import { callLLM, callLLMWithUserConfig } from '../llm/llmService.js';
import {
  WRITER_SYSTEM_PROMPT,
} from '../prompts/technicalWriterPrompt.js';
import { buildDocumentationPrompt } from '../prompts/documentationPrompt.js';

/**
 * Run the Technical Writer Agent
 *
 * @param {Object} memory - Shared memory object from pipeline
 * @param {Object|null} fileTreeData - Repository file tree structure (optional)
 * @returns {Promise<void>}
 */
export async function runTechnicalWriter(memory, fileTreeData = null) {
  const agentName = 'writer';

  try {
    memory.setAgentStatus(agentName, 'thinking', 'Starting documentation generation...');

    // Get context from memory
    const files = memory.get('files') || [];
    const repoSummary = memory.get('repoSummary') || {};
    const bugs = memory.get('bugs') || [];
    const userLLMConfig = memory.get('userLLMConfig');

    // Build code context string from files
    const codeContext = buildCodeContext(files, repoSummary, bugs);

    // ============================================
    // MODIFIED: Pass fileTreeData to prompt builder
    // ============================================
    const prompt = buildDocumentationPrompt(codeContext, fileTreeData);

    const messages = [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    memory.setAgentStatus(agentName, 'acting', 'Generating documentation content...');

    const response = await callLLMWithUserConfig(messages, {
      agentRole: agentName,
      jsonMode: true,
      temperature: 0.4,
      maxTokens: 4096
    }, userLLMConfig);

    // Parse result
    let result;
    if (typeof response.content === 'object') {
      result = response.content;
    } else {
      result = JSON.parse(response.content);
    }

    // Extract the documentation markdown string
    const documentation = result.documentation || result;

    // If result is a plain string, use it directly
    const docString = typeof documentation === 'string'
      ? documentation
      : JSON.stringify(documentation);

    // Store documentation in shared memory
    memory.setDocumentation(docString);

    // Store metadata separately
    memory.set('documentationMeta', {
      sections: result.sections || [],
      wordCount: result.wordCount || 0,
      coverageScore: result.coverageScore || 0
    });

    // Send handoff message to architecture agent
    const docPreview = docString.substring(0, 150).replace(/\n/g, ' ');

    memory.addMessage(
      agentName,
      'architecture',
      `Documentation complete (${docString.length} chars).
       Preview: "${docPreview}..."
       Please review architectural patterns and suggest improvements.`,
      'handoff'
    );

    memory.setAgentStatus(agentName, 'complete', 'Documentation generation complete');

    return {
      documentation: docString,
      meta: memory.get('documentationMeta')
    };

  } catch (error) {
    console.error(`[${agentName}] Error:`, error.message);
    memory.setAgentStatus(agentName, 'error', error.message);

    // Fallback logic
    const fallback = generateFallbackDocumentation(
      memory.get('repoSummary'),
      memory.get('files'),
      memory.get('bugs') || []
    );
    memory.setDocumentation(fallback);
    memory.setAgentStatus(agentName, 'complete', 'Documentation generated (fallback)');

    return { documentation: fallback, meta: {} };
  }
}

/**
 * Build code context string from files and analysis data
 * @param {Array} files - Array of file objects
 * @param {Object} repoSummary - Repository summary
 * @param {Array} bugs - Array of detected bugs
 * @returns {string} Formatted code context
 */
function buildCodeContext(files, repoSummary, bugs) {
  let context = '';

  // Add repo info
  if (repoSummary) {
    context += `Repository: ${repoSummary.owner}/${repoSummary.repo}\n`;
    context += `Branch: ${repoSummary.branch || 'main'}\n\n`;
  }

  // Add key files content
  const keyFiles = files.slice(0, 20); // Limit to avoid token overflow
  keyFiles.forEach(file => {
    context += `### File: ${file.path}\n`;
    context += '```' + (file.language || '') + '\n';
    context += file.content?.substring(0, 3000) || '// Content not available';
    context += '\n```\n\n';
  });

  // Add security findings summary
  if (bugs && bugs.length > 0) {
    context += '\n### Security Findings\n';
    bugs.forEach((bug, i) => {
      context += `${i + 1}. [${bug.severity}] ${bug.type}: ${bug.message} (${bug.file}:${bug.line})\n`;
    });
  }

  return context;
}

/**
 * Fallback documentation generator (no LLM)
 * Used when LLM call fails to ensure pipeline continues
 */
export function generateFallbackDocumentation(repoSummary, files, bugs) {
  const repoName = repoSummary?.repo || 'Project';
  const projectType = repoSummary?.projectType || 'software';
  const owner = repoSummary?.owner || 'unknown';
  const languages = Object.keys(repoSummary?.languages || {}).join(', ') || 'Not detected';
  const fileCount = files?.length || 0;

  let markdown = `# ${repoName} Documentation

## Overview
This is a ${projectType} project.
- **Repository**: ${owner}/${repoName}
- **Languages**: ${languages}
- **Files**: ${fileCount} files analyzed

## Project Structure
`;

  // Add file listing
  if (files && files.length > 0) {
    for (const file of files) {
      markdown += `- \`${file.path}\` — ${file.language || 'Unknown'} (${file.size || 0} bytes)\n`;
    }
  } else {
    markdown += `No files analyzed.\n`;
  }

  markdown += `\n## Known Issues\n`;

  if (!bugs || bugs.length === 0) {
    markdown += `No issues found during security analysis.\n`;
  } else {
    markdown += `> ⚠️ The following issues were identified by the Security Specialist Agent.\n\n`;

    for (const bug of bugs) {
      const severity = (bug.severity || 'medium').toUpperCase();
      const title = bug.title || 'Untitled Issue';
      const file = bug.file || 'Unknown file';
      const line = bug.line || 'N/A';
      const description = bug.description || 'No description provided.';
      const suggestedFix = bug.suggestedFix || 'No fix suggested.';

      markdown += `### [${severity}] ${title}
- **File**: \`${file}\` (line ${line})
- **Description**: ${description}
- **Fix**: ${suggestedFix}

`;
    }
  }

  markdown += `## Setup
`;

  // Add setup instructions based on project type
  if (projectType.toLowerCase().includes('node') || projectType.toLowerCase().includes('javascript')) {
    markdown += `\`\`\`bash
npm install
npm start
\`\`\`
`;
  } else if (projectType.toLowerCase().includes('python')) {
    markdown += `\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`
`;
  } else {
    markdown += `Please refer to the project's README for setup instructions.
`;
  }

  markdown += `
---
*Documentation generated by AgentLens Technical Writer Agent*`;

  return markdown;
}