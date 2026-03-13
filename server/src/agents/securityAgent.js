import { callLLM } from '../llm/llmService.js';
import {
  SECURITY_SYSTEM_PROMPT,
  buildFileAnalysisPrompt,
  buildSummaryPrompt
} from '../prompts/securityPrompt.js';

/**
 * Main security analysis function
 * Analyzes each file for bugs, vulnerabilities, and quality issues
 */
export async function runSecurityAnalysis(memory) {
  try {
    // STEP 1 — Initialize
    memory.setAgentStatus('security', 'thinking', 'Reading coordinator plan...');
    const files = memory.get('files');
    const plan = memory.get('plan');
    const allBugs = [];

    console.log(`🛡️  Security Agent starting — analyzing ${files.length} files`);

    // STEP 2 — Send opening inter-agent message
    memory.addMessage(
      'coordinator',
      'security',
      `Starting security analysis of ${files.length} files. Focus: ${plan?.agentFocusAreas?.security || 'full security scan'}`,
      'instruction'
    );

    // STEP 3 — Determine which files to analyze
    const priorityFiles = plan?.priorityFiles || [];
    const sortedFiles = [...files].sort((a, b) => {
      const aIsPriority = priorityFiles.includes(a.path);
      const bIsPriority = priorityFiles.includes(b.path);
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return 0;
    });

    // STEP 4 — Analyze each file in a loop
    for (const file of sortedFiles) {
      // a. Update status
      memory.setAgentStatus('security', 'acting', `Scanning ${file.path}...`);
      console.log(`  🔍 Analyzing: ${file.path}`);

      // b. Skip files with no content or very small files
      if (!file.content || file.content.length < 50) {
        console.log(`  ⏭️  Skipping ${file.path} — no content`);
        continue;
      }

      // c. Truncate very large files
      const truncatedContent = file.content.length > 8000
        ? file.content.substring(0, 8000) + '\n\n[... file truncated for analysis ...]'
        : file.content;
      const fileForAnalysis = { ...file, content: truncatedContent };

      // d. Build the prompt
      const userMessage = buildFileAnalysisPrompt(fileForAnalysis, plan);

      // e. Call LLM
      const messages = [
        { role: 'system', content: SECURITY_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ];

      try {
        const response = await callLLM(messages, {
          agentRole: 'security',
          jsonMode: true,
          temperature: 0.1
        });

        // Parse result
        let result;
        if (typeof response.content === 'object') {
          result = response.content;
        } else {
          result = JSON.parse(response.content);
        }

        // If file has issues, process them
        if (result.hasIssues && result.issues && result.issues.length > 0) {
          for (const issue of result.issues) {
            // Ensure each bug has required fields, fill defaults if missing
            const bug = {
              id: issue.id || `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              severity: issue.severity || 'medium',
              type: issue.type || 'other',
              title: issue.title || 'Issue found',
              description: issue.description || '',
              file: file.path,
              line: issue.line || null,
              code: issue.code || '',
              suggestedFix: issue.suggestedFix || '',
              fixedCode: issue.fixedCode || ''
            };

            // Add to local array
            allBugs.push(bug);

            // Write to shared memory immediately (so SSE streams it in real time)
            memory.addBug(bug);

            console.log(`    ⚠️  Found [${bug.severity.toUpperCase()}] ${bug.title} in ${file.path}`);
          }

          // Send communication message for significant findings
          const criticalOrHigh = result.issues.filter(i =>
            i.severity === 'critical' || i.severity === 'high'
          );
          if (criticalOrHigh.length > 0) {
            memory.addMessage(
              'security',
              'writer',
              `Found ${criticalOrHigh.length} critical/high severity issue(s) in ${file.path}: ${criticalOrHigh.map(i => i.title).join(', ')}`,
              'alert'
            );
          }
        } else {
          console.log(`    ✅ ${file.path} — no issues found`);
        }

      } catch (parseError) {
        console.error(`  ❌ Failed to parse security analysis for ${file.path}:`, parseError.message);
        // Don't crash — just skip this file and continue
      }

      // f. Add a small delay between files to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // STEP 5 — Generate summary after all files analyzed
    memory.setAgentStatus('security', 'thinking', 'Generating security summary...');

    let securitySummary = {
      totalIssues: allBugs.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      mostVulnerableFile: null,
      topRisk: 'No critical issues found',
      overallSecurityScore: 100
    };

    if (allBugs.length > 0) {
      try {
        const summaryMessages = [
          { role: 'system', content: SECURITY_SYSTEM_PROMPT },
          { role: 'user', content: buildSummaryPrompt(allBugs, sortedFiles.length) }
        ];

        const summaryResponse = await callLLM(summaryMessages, {
          agentRole: 'security',
          jsonMode: true,
          temperature: 0.1
        });

        let parsedSummary;
        if (typeof summaryResponse.content === 'object') {
          parsedSummary = summaryResponse.content;
        } else {
          parsedSummary = JSON.parse(summaryResponse.content);
        }

        securitySummary = {
          totalIssues: allBugs.length,
          bySeverity: parsedSummary.bySeverity || securitySummary.bySeverity,
          mostVulnerableFile: parsedSummary.mostVulnerableFile || null,
          topRisk: parsedSummary.topRisk || 'Issues found',
          overallSecurityScore: parsedSummary.overallSecurityScore || 50
        };

      } catch (summaryError) {
        console.warn('  ⚠️  Failed to generate LLM summary, computing manually:', summaryError.message);

        // Count bugs by severity
        for (const bug of allBugs) {
          const severity = bug.severity?.toLowerCase() || 'medium';
          if (securitySummary.bySeverity[severity] !== undefined) {
            securitySummary.bySeverity[severity]++;
          }
        }

        // Find most vulnerable file
        const fileCounts = {};
        for (const bug of allBugs) {
          fileCounts[bug.file] = (fileCounts[bug.file] || 0) + 1;
        }
        let maxCount = 0;
        let mostVulnerable = null;
        for (const [filePath, count] of Object.entries(fileCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostVulnerable = filePath;
          }
        }
        securitySummary.mostVulnerableFile = mostVulnerable;

        // Calculate overall security score
        const { critical, high, medium, low } = securitySummary.bySeverity;
        let score = 100 - (critical * 25) - (high * 15) - (medium * 5) - (low * 2);
        score = Math.max(0, Math.min(100, score));
        securitySummary.overallSecurityScore = score;

        // Determine top risk
        const criticalBug = allBugs.find(b => b.severity === 'critical');
        const highBug = allBugs.find(b => b.severity === 'high');
        if (criticalBug) {
          securitySummary.topRisk = criticalBug.title;
        } else if (highBug) {
          securitySummary.topRisk = highBug.title;
        } else {
          securitySummary.topRisk = 'Minor issues found';
        }
      }
    }

    // Store summary
    memory.set('securitySummary', securitySummary);

    // STEP 6 — Send completion message
    memory.addMessage(
      'security',
      'writer',
      `Security analysis complete. Found ${allBugs.length} issues (${securitySummary.bySeverity.critical} critical, ${securitySummary.bySeverity.high} high). Security score: ${securitySummary.overallSecurityScore}/100. Passing findings to you for documentation.`,
      'handoff'
    );

    // STEP 7 — Mark complete
    memory.setAgentStatus('security', 'complete', `Found ${allBugs.length} issues`);
    console.log(`🛡️  Security Agent complete — ${allBugs.length} total issues found`);

    // STEP 8 — Return results
    return {
      bugs: allBugs,
      summary: securitySummary,
      filesAnalyzed: sortedFiles.length
    };

  } catch (error) {
    memory.setAgentStatus('security', 'error', error.message);
    console.error('Security Agent failed:', error);
    throw error;
  }
}

/**
 * Utility function to get security statistics from memory
 */
export function getSecurityStats(memory) {
  const bugs = memory.get('bugs') || [];
  const securitySummary = memory.get('securitySummary');

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const bug of bugs) {
    const severity = bug.severity?.toLowerCase() || 'medium';
    if (bySeverity[severity] !== undefined) {
      bySeverity[severity]++;
    }
  }

  return {
    total: bugs.length,
    bySeverity,
    score: securitySummary?.overallSecurityScore || null
  };
}
