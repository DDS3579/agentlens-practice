import { callLLM } from '../llm/llmService.js';
import {
  ARCHITECTURE_SYSTEM_PROMPT,
  buildArchitecturePrompt,
  buildPatternAnalysisPrompt
} from '../prompts/architecturePrompt.js';

/**
 * Main architecture review function
 * Analyzes codebase structure and suggests improvements based on all specialist findings
 */
export async function runArchitectureReview(memory) {
  try {
    // STEP 1 — Initialize and read ALL context
    memory.setAgentStatus('architecture', 'thinking', 'Reading all specialist reports...');

    const files = memory.get('files');
    const plan = memory.get('plan');
    const bugs = memory.get('bugs') || [];
    const documentation = memory.get('documentation');
    const repoSummary = memory.get('repoSummary');

    console.log(`🏗️  Architecture Agent starting`);
    console.log(`   Files to review: ${files.length}`);
    console.log(`   Bugs to address: ${bugs.length}`);
    console.log(`   Has documentation: ${documentation ? 'yes' : 'no'}`);

    // STEP 2 — Acknowledge receiving context from both agents
    const bugTypes = {};
    for (const bug of bugs) {
      bugTypes[bug.type] = (bugTypes[bug.type] || 0) + 1;
    }
    const dominantBugType = Object.entries(bugTypes).sort((a, b) => b[1] - a[1])[0];

    memory.addMessage(
      'writer',
      'architecture',
      `Received documentation and ${bugs.length} security findings. 
       Dominant issue pattern: ${dominantBugType ? dominantBugType[0] + ' (' + dominantBugType[1] + ' occurrences)' : 'none'}.
       Will suggest structural fixes to prevent these patterns at the root level.`,
      'acknowledgment'
    );

    // STEP 3 — Run pattern analysis first (quick, focused call)
    memory.setAgentStatus('architecture', 'acting', 'Analyzing code patterns...');

    const filesForAnalysis = files.map(f => ({
      ...f,
      content: f.content && f.content.length > 4000
        ? f.content.substring(0, 4000) + '\n[truncated]'
        : f.content || ''
    }));

    let patternResult = null;

    try {
      const patternMessages = [
        { role: 'system', content: ARCHITECTURE_SYSTEM_PROMPT },
        { role: 'user', content: buildPatternAnalysisPrompt(filesForAnalysis) }
      ];

      const patternResponse = await callLLM(patternMessages, {
        agentRole: 'architecture',
        jsonMode: true,
        temperature: 0.2
      });

      patternResult = typeof patternResponse.content === 'object'
        ? patternResponse.content
        : JSON.parse(patternResponse.content);

      memory.set('patternAnalysis', patternResult);
      console.log(`🏗️  Patterns found: ${(patternResult.patternsPresent || []).join(', ') || 'none'}`);
      console.log(`🏗️  Anti-patterns: ${(patternResult.antiPatterns || []).join(', ') || 'none'}`);

    } catch (e) {
      console.log('🏗️  Pattern analysis skipped:', e.message);
    }

    // Add delay before next LLM call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 4 — Run main architecture review
    memory.setAgentStatus('architecture', 'acting', 'Generating refactoring suggestions...');

    const userMessage = buildArchitecturePrompt(filesForAnalysis, bugs, documentation, plan);

    const messages = [
      { role: 'system', content: ARCHITECTURE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];

    console.log('🏗️  Calling LLM for architecture review...');

    try {
      const response = await callLLM(messages, {
        agentRole: 'architecture',
        jsonMode: true,
        temperature: 0.3,
        maxTokens: 4096
      });

      let result;
      if (typeof response.content === 'object') {
        result = response.content;
      } else {
        result = JSON.parse(response.content);
      }

      // Process and store each refactor suggestion
      const suggestions = result.suggestions || [];

      for (const suggestion of suggestions) {
        const refactor = {
          id: suggestion.id || `arch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: suggestion.title || 'Improvement suggestion',
          description: suggestion.description || '',
          impact: suggestion.impact || 'medium',
          category: suggestion.category || 'maintainability',
          affectedFiles: suggestion.affectedFiles || [],
          beforeCode: suggestion.beforeCode || '',
          afterCode: suggestion.afterCode || '',
          preventsBugIds: suggestion.preventsBugIds || [],
          estimatedEffort: suggestion.estimatedEffort || 'Unknown'
        };

        // Add to shared memory (triggers SSE event)
        memory.addRefactor(refactor);

        console.log(`  🔧 Suggestion [${refactor.impact.toUpperCase()}]: ${refactor.title}`);

        // If this suggestion prevents specific bugs, log the connection
        if (refactor.preventsBugIds.length > 0) {
          console.log(`     └─ Prevents bugs: ${refactor.preventsBugIds.join(', ')}`);
        }
      }

      // Store full architecture result
      memory.set('architectureResult', {
        overallAssessment: result.overallAssessment || '',
        architectureScore: result.architectureScore || 50,
        biggestRisk: result.biggestRisk || '',
        quickWins: result.quickWins || [],
        patternAnalysis: patternResult
      });

      console.log(`🏗️  Architecture score: ${result.architectureScore}/100`);
      console.log(`🏗️  Suggestions generated: ${suggestions.length}`);

    } catch (llmError) {
      console.error('🏗️  Architecture LLM call failed:', llmError.message);

      // Generate fallback suggestions based on bug patterns
      const fallbackSuggestions = generateFallbackSuggestions(bugs, files);
      for (const refactor of fallbackSuggestions) {
        memory.addRefactor(refactor);
      }

      memory.set('architectureResult', {
        overallAssessment: 'Architecture review completed with limited analysis.',
        architectureScore: 50,
        biggestRisk: bugs.length > 0 ? bugs[0].title : 'Unknown',
        quickWins: [],
        patternAnalysis: patternResult
      });

      console.log('🏗️  Used fallback architecture suggestions');
    }

    // STEP 5 — Send final summary message
    const refactors = memory.get('refactors') || [];
    const archResult = memory.get('architectureResult');

    memory.addMessage(
      'architecture',
      'coordinator',
      `Architecture review complete. Generated ${refactors.length} structural suggestions. 
       Architecture score: ${archResult.architectureScore}/100. 
       Biggest risk: ${archResult.biggestRisk}. 
       Ready for final compilation.`,
      'handoff'
    );

    // STEP 6 — Mark complete
    memory.setAgentStatus('architecture', 'complete', `${refactors.length} suggestions generated`);
    console.log('🏗️  Architecture Agent complete');

    // STEP 7 — Return
    return {
      refactors: memory.get('refactors'),
      result: memory.get('architectureResult'),
      patterns: patternResult
    };

  } catch (error) {
    memory.setAgentStatus('architecture', 'error', error.message);
    console.error('Architecture Agent failed:', error);

    // Generate fallback suggestions
    const bugs = memory.get('bugs') || [];
    const files = memory.get('files') || [];
    const fallbackSuggestions = generateFallbackSuggestions(bugs, files);

    for (const refactor of fallbackSuggestions) {
      memory.addRefactor(refactor);
    }

    memory.setAgentStatus('architecture', 'complete', 'Suggestions generated (fallback)');

    return {
      refactors: memory.get('refactors') || [],
      result: {},
      patterns: null
    };
  }
}

/**
 * Fallback suggestion generator (no LLM)
 * Generates basic suggestions based on bug patterns
 */
export function generateFallbackSuggestions(bugs, files) {
  const suggestions = [];
  const bugsByType = {};

  // Group bugs by type
  for (const bug of bugs) {
    if (!bugsByType[bug.type]) {
      bugsByType[bug.type] = [];
    }
    bugsByType[bug.type].push(bug);
  }

  // 1. Check for SQL injection bugs
  if (bugsByType['sql_injection'] && bugsByType['sql_injection'].length > 0) {
    const sqlBugs = bugsByType['sql_injection'];
    const affectedFiles = [...new Set(sqlBugs.map(b => b.file))];

    suggestions.push({
      id: 'arch_fallback_001',
      title: 'Implement Centralized Query Builder',
      description: 'Multiple SQL injection vulnerabilities detected. Centralizing database queries with a query builder and parameterization would prevent this class of vulnerability.',
      impact: 'high',
      category: 'security',
      affectedFiles: affectedFiles,
      beforeCode: 'const query = `SELECT * FROM users WHERE id = ${userId}`',
      afterCode: 'const query = db.select("users").where({ id: userId })',
      preventsBugIds: sqlBugs.map(b => b.id),
      estimatedEffort: '1 day'
    });
  }

  // 2. Check for hardcoded secrets
  if (bugsByType['hardcoded_secret'] && bugsByType['hardcoded_secret'].length > 0) {
    const secretBugs = bugsByType['hardcoded_secret'];
    const affectedFiles = [...new Set(secretBugs.map(b => b.file))];

    suggestions.push({
      id: 'arch_fallback_002',
      title: 'Implement Centralized Configuration Management',
      description: 'Hardcoded secrets detected. A centralized config module that loads from environment variables would prevent accidental secret exposure.',
      impact: 'high',
      category: 'security',
      affectedFiles: affectedFiles,
      beforeCode: 'const JWT_SECRET = "mysecret123"',
      afterCode: 'import config from "./config.js"\nconst JWT_SECRET = config.jwtSecret',
      preventsBugIds: secretBugs.map(b => b.id),
      estimatedEffort: '2 hours'
    });
  }

  // 3. Check for unhandled errors or missing validation
  const errorBugs = [
    ...(bugsByType['unhandled_error'] || []),
    ...(bugsByType['missing_validation'] || [])
  ];

  if (errorBugs.length > 0) {
    suggestions.push({
      id: 'arch_fallback_003',
      title: 'Add Global Error Handling Middleware',
      description: 'Multiple unhandled errors and missing validations found. A global error handler and input validation middleware would centralize this logic.',
      impact: 'medium',
      category: 'error-handling',
      affectedFiles: files.map(f => f.path),
      beforeCode: 'app.get("/api/users/:id", async (req, res) => {\n  const user = await getUser(req.params.id)\n  res.json(user)\n})',
      afterCode: 'app.get("/api/users/:id", validate(userSchema), asyncHandler(async (req, res) => {\n  const user = await getUser(req.params.id)\n  res.json(user)\n}))',
      preventsBugIds: errorBugs.map(b => b.id),
      estimatedEffort: '3 hours'
    });
  }

  // 4. Always add input validation suggestion
  suggestions.push({
    id: 'arch_fallback_004',
    title: 'Add Input Validation Layer',
    description: 'Centralize input validation using a schema validation library like Zod or Joi at the route level.',
    impact: 'medium',
    category: 'security',
    affectedFiles: files.map(f => f.path),
    beforeCode: '// No validation\napp.post("/api/login", async (req, res) => {\n  const { username, password } = req.body',
    afterCode: 'const loginSchema = z.object({\n  username: z.string().min(3),\n  password: z.string().min(8)\n})\napp.post("/api/login", validate(loginSchema), async (req, res) => {',
    preventsBugIds: [],
    estimatedEffort: '2 hours'
  });

  return suggestions;
}
