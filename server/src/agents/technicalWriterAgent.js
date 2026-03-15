// server/src/agents/technicalWriterAgent.js

import { callLLM, callLLMWithUserConfig } from '../llm/llmService.js';
import {
  WRITER_SYSTEM_PROMPT,
} from '../prompts/technicalWriterPrompt.js';
import { buildDocumentationPrompt } from '../prompts/documentationPrompt.js';
import {
  PRO_DOCS_SYSTEM_PROMPT,
  buildProDocumentationPrompt,
} from '../prompts/proDocumentationPrompts.js';

/**
 * Delay helper
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Strip markdown fences from LLM response
 */
function stripMarkdownFences(text) {
  if (!text) return '';
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

/**
 * Select premium model for Pro documentation
 */
function selectPremiumModel(llmConfig) {
  const provider = llmConfig?.provider || 'openai';
  
  switch (provider) {
    case 'anthropic':
      return {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514'
      };
    case 'openai':
      return {
        provider: 'openai',
        model: 'gpt-4o'
      };
    default:
      return {
        provider: llmConfig?.provider || 'openai',
        model: llmConfig?.model || 'gpt-4o'
      };
  }
}

/**
 * Parse JSON response from LLM
 */
function parseProDocsResponse(response) {
  try {
    const cleaned = stripMarkdownFences(response);
    
    // Find JSON object in response
    let jsonStr = cleaned;
    if (!cleaned.trim().startsWith('{')) {
      const objectMatch = cleaned.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate it has expected sections
    const requiredSections = ['overview', 'architecture', 'api_reference', 
                              'data_models', 'security', 'setup_guide', 
                              'developer_guide', 'changelog_template'];
    
    const missingSections = requiredSections.filter(s => !parsed[s]);
    if (missingSections.length > 0) {
      console.warn(`[TechnicalWriter] Missing sections: ${missingSections.join(', ')}`);
      // Don't fail, just continue with what we have
    }
    
    return { success: true, sections: parsed };
    
  } catch (error) {
    console.error('[TechnicalWriter] JSON parse error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run the Technical Writer Agent
 *
 * @param {Object} memory - Shared memory object from pipeline
 * @param {Object|null} fileTreeData - Repository file tree structure
 * @param {boolean} isPro - Whether user is Pro tier
 * @param {Object|null} archResult - Architecture agent results (for Pro)
 * @param {Object|null} secResult - Security agent results (for Pro)
 * @returns {Promise<Object>}
 */
export async function runTechnicalWriter(
  memory, 
  fileTreeData = null,
  isPro = false,
  archResult = null,
  secResult = null
) {
  const agentName = 'writer';

  try {
    memory.setAgentStatus(agentName, 'thinking', 'Starting documentation generation...');

    // Get context from memory
    const files = memory.get('files') || [];
    const repoSummary = memory.get('repoSummary') || {};
    const bugs = memory.get('bugs') || [];
    const userLLMConfig = memory.get('userLLMConfig');
    const plan = memory.get('plan');

    // ============================================
    // PRO TIER DOCUMENTATION
    // ============================================
    if (isPro) {
      console.log('[TechnicalWriter] Generating Pro-tier documentation...');
      
      try {
        memory.setAgentStatus(agentName, 'acting', 'Generating comprehensive Pro documentation...');

        // Build Pro documentation prompt
        const repoData = { files, repoSummary };
        const prompt = buildProDocumentationPrompt(
          repoData,
          plan,
          archResult,
          secResult,
          fileTreeData,
          userLLMConfig
        );

        // Select premium model
        const { provider, model } = selectPremiumModel(userLLMConfig);
        console.log(`[TechnicalWriter] Using premium model: ${provider}/${model}`);

        const messages = [
          { role: 'system', content: PRO_DOCS_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ];

        // Call LLM with premium settings
        const response = await callLLMWithUserConfig(messages, {
          agentRole: agentName,
          temperature: 0.3,
          maxTokens: 8000,
          provider,
          model,
        }, userLLMConfig);

        const responseContent = response.content || response;

        // Parse JSON response
        const parseResult = parseProDocsResponse(
          typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent)
        );

        if (parseResult.success) {
          console.log('[TechnicalWriter] Pro documentation generated successfully');

          // Store in memory
          const proDocResult = {
            isPro: true,
            sections: parseResult.sections,
            raw: typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent)
          };

          memory.setDocumentation(JSON.stringify(proDocResult));
          memory.set('documentationMeta', {
            isPro: true,
            sectionCount: Object.keys(parseResult.sections).length,
            generatedAt: new Date().toISOString()
          });

          memory.addMessage(
            agentName,
            'coordinator',
            `Pro documentation complete with ${Object.keys(parseResult.sections).length} sections.`,
            'handoff'
          );

          memory.setAgentStatus(agentName, 'complete', 'Pro documentation generated');

          return proDocResult;

        } else {
          // Parse failed - fall back to free tier
          console.warn('[TechnicalWriter] Pro docs parse failed, falling back to free tier:', parseResult.error);
          // Continue to free tier logic below
        }

      } catch (proError) {
        console.error('[TechnicalWriter] Pro documentation error:', proError.message);
        console.log('[TechnicalWriter] Falling back to free tier documentation...');
        // Continue to free tier logic below
      }
    }

    // ============================================
    // FREE TIER DOCUMENTATION (default or fallback)
    // ============================================
    console.log('[TechnicalWriter] Generating free-tier documentation...');
    memory.setAgentStatus(agentName, 'acting', 'Generating documentation content...');

    // Build code context
    const codeContext = buildCodeContext(files, repoSummary, bugs);

    // Build free tier prompt
    const prompt = buildDocumentationPrompt(codeContext, fileTreeData);

    const messages = [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

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
      try {
        result = JSON.parse(response.content);
      } catch {
        result = { documentation: response.content };
      }
    }

    // Extract documentation string
    const documentation = result.documentation || result;
    const docString = typeof documentation === 'string'
      ? documentation
      : JSON.stringify(documentation);

    // Store in memory
    const freeDocResult = {
      isPro: false,
      content: docString
    };

    memory.setDocumentation(JSON.stringify(freeDocResult));
    memory.set('documentationMeta', {
      isPro: false,
      sections: result.sections || [],
      wordCount: result.wordCount || 0,
      coverageScore: result.coverageScore || 0
    });

    // Send handoff message
    const docPreview = docString.substring(0, 150).replace(/\n/g, ' ');
    memory.addMessage(
      agentName,
      'architecture',
      `Documentation complete (${docString.length} chars). Preview: "${docPreview}..."`,
      'handoff'
    );

    memory.setAgentStatus(agentName, 'complete', 'Documentation generation complete');

    return freeDocResult;

  } catch (error) {
    console.error(`[${agentName}] Error:`, error.message);
    memory.setAgentStatus(agentName, 'error', error.message);

    // Fallback documentation
    const fallback = generateFallbackDocumentation(
      memory.get('repoSummary'),
      memory.get('files'),
      memory.get('bugs') || []
    );

    const fallbackResult = {
      isPro: false,
      content: fallback
    };

    memory.setDocumentation(JSON.stringify(fallbackResult));
    memory.setAgentStatus(agentName, 'complete', 'Documentation generated (fallback)');

    return fallbackResult;
  }
}

/**
 * Build code context string from files and analysis data
 */
function buildCodeContext(files, repoSummary, bugs) {
  let context = '';

  if (repoSummary) {
    context += `Repository: ${repoSummary.owner}/${repoSummary.repo}\n`;
    context += `Branch: ${repoSummary.branch || 'main'}\n\n`;
  }

  const keyFiles = files.slice(0, 20);
  keyFiles.forEach(file => {
    context += `### File: ${file.path}\n`;
    context += '```' + (file.language || '') + '\n';
    context += file.content?.substring(0, 3000) || '// Content not available';
    context += '\n```\n\n';
  });

  if (bugs && bugs.length > 0) {
    context += '\n### Security Findings\n';
    bugs.forEach((bug, i) => {
      context += `${i + 1}. [${bug.severity}] ${bug.type}: ${bug.message} (${bug.file}:${bug.line})\n`;
    });
  }

  return context;
}

/**
 * Fallback documentation generator
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

  if (files && files.length > 0) {
    for (const file of files.slice(0, 20)) {
      markdown += `- \`${file.path}\` — ${file.language || 'Unknown'}\n`;
    }
  }

  markdown += `\n## Known Issues\n`;

  if (!bugs || bugs.length === 0) {
    markdown += `No issues found during security analysis.\n`;
  } else {
    bugs.slice(0, 10).forEach(bug => {
      markdown += `- **[${(bug.severity || 'medium').toUpperCase()}]** ${bug.title || bug.message}\n`;
    });
  }

  markdown += `\n---\n*Documentation generated by AgentLens*`;

  return markdown;
}

// Export for backward compatibility
export default runTechnicalWriter;