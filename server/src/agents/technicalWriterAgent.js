import { callLLM } from '../llm/llmService.js';
import {
  WRITER_SYSTEM_PROMPT,
  buildDocumentationPrompt,
  buildRefinementPrompt
} from '../prompts/technicalWriterPrompt.js';

/**
 * Main technical writer function
 * Generates documentation incorporating security findings from previous agent
 */
export async function runTechnicalWriter(memory) {
  try {
    // STEP 1 — Initialize
    memory.setAgentStatus('writer', 'thinking', 'Reading security findings...');

    const files = memory.get('files');
    const plan = memory.get('plan');
    const bugs = memory.get('bugs') || [];
    const repoSummary = memory.get('repoSummary');

    console.log(`📝 Technical Writer Agent starting`);
    console.log(`   Files to document: ${files.length}`);
    console.log(`   Known bugs to incorporate: ${bugs.length}`);

    // STEP 2 — Send opening inter-agent message acknowledging security findings
    const criticalCount = bugs.filter(b => b.severity === 'critical').length;
    const highCount = bugs.filter(b => b.severity === 'high').length;

    memory.addMessage(
      'security',
      'writer',
      `Acknowledged. Incorporating ${bugs.length} security findings into documentation. 
       Will highlight ${criticalCount} critical and ${highCount} high severity issues in Known Issues section.`,
      'acknowledgment'
    );

    // STEP 3 — Prepare files for documentation
    const filesForDoc = files.map(file => ({
      ...file,
      content: file.content && file.content.length > 6000
        ? file.content.substring(0, 6000) + '\n\n[... truncated ...]'
        : file.content || ''
    }));

    // STEP 4 — Update status and call LLM
    memory.setAgentStatus('writer', 'acting', 'Generating documentation...');

    const userMessage = buildDocumentationPrompt(filesForDoc, bugs, plan);

    const messages = [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];

    console.log('📝 Calling LLM for documentation generation...');

    try {
      const response = await callLLM(messages, {
        agentRole: 'writer',
        jsonMode: true,
        temperature: 0.4,
        maxTokens: 4096
      });

      // Parse result
      let result;
      if (typeof response.content === 'object') {
        result = response.content;
      } else {
        result = JSON.parse(response.content);
      }

      // Extract the documentation markdown string
      const documentation = result.documentation || result;

      // If result is a plain string (LLM ignored JSON mode), use it directly
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

      console.log(`📝 Documentation generated — ${result.wordCount || 'unknown'} words`);
      console.log(`   Sections: ${(result.sections || []).join(', ')}`);

    } catch (llmError) {
      console.error('📝 LLM call failed:', llmError.message);

      // Generate fallback documentation manually
      const fallbackDoc = generateFallbackDocumentation(repoSummary, files, bugs);
      memory.setDocumentation(fallbackDoc);
      console.log('📝 Used fallback documentation generator');
    }

    // STEP 5 — Send handoff message to architecture agent
    const documentation = memory.get('documentation');
    const docPreview = documentation.substring(0, 150).replace(/\n/g, ' ');

    memory.addMessage(
      'writer',
      'architecture',
      `Documentation complete (${documentation.length} chars). 
       Documented ${files.length} files with ${bugs.length} known issues noted. 
       Preview: "${docPreview}..."
       Please review architectural patterns and suggest improvements.`,
      'handoff'
    );

    // STEP 6 — Mark complete
    memory.setAgentStatus('writer', 'complete', `Documentation generated`);
    console.log('📝 Technical Writer Agent complete');

    // STEP 7 — Return
    return {
      documentation: memory.get('documentation'),
      meta: memory.get('documentationMeta')
    };

  } catch (error) {
    memory.setAgentStatus('writer', 'error', error.message);
    console.error('Technical Writer Agent failed:', error);

    // Instead of rethrowing — generate fallback and continue
    const fallback = generateFallbackDocumentation(
      memory.get('repoSummary'),
      memory.get('files'),
      memory.get('bugs') || []
    );
    memory.setDocumentation(fallback);
    memory.setAgentStatus('writer', 'complete', 'Documentation generated (fallback)');

    return { documentation: fallback, meta: {} };
  }
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