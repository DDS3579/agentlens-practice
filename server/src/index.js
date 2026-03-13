// Actual required version of the index.js start

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRoute from './routes/analyzeRoute.js';  // Commented out until created
import githubRoute from './routes/githubRoute.js';
import { checkProviderHealth } from './llm/llmService.js'

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/github', githubRoute);
app.use('/api/analyze', analyzeRoute);  // Commented out until created

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/llm/health', async (req, res) => {
  const health = await checkProviderHealth()
  res.json(health)
})

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`AgentLens server running on port ${PORT}`);
});

// Actual required version of the index.js end




// Variant of the index.js for testing APIs start

// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// // import analyzeRoute from './routes/analyzeRoute.js';  // Commented out until created
// import githubRoute from './routes/githubRoute.js';
// import { checkProviderHealth } from './llm/llmService.js'
// import { createSession, destroySession } from './memory/sharedMemory.js'
// import { createSSEStream, sendSSEEvent } from './streaming/sseEmitter.js'
// import { v4 as uuidv4 } from 'uuid'
// import { buildPlanningPrompt } from './prompts/coordinatorPrompt.js'
// import { buildFileAnalysisPrompt } from './prompts/securityPrompt.js'
// // TEMP TEST — Coordinator Agent
// import { runPlanningPhase } from './agents/coordinatorAgent.js'
// // TEMP TEST — Security Agent
// import { runSecurityAnalysis, getSecurityStats } from './agents/securityAgent.js'
// import { runArchitectureReview } from './agents/architectureAgent.js'
// import { readFileSync } from 'fs'
// import { join, dirname } from 'path'
// import { fileURLToPath } from 'url'
// import { runTechnicalWriter } from './agents/technicalWriterAgent.js'



// const __dirname = dirname(fileURLToPath(import.meta.url))


// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(cors({
//   origin: 'http://localhost:5173'
// }));

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// app.use('/api/github', githubRoute);
// // app.use('/api/analyze', analyzeRoute);  // Commented out until created

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// app.use((err, req, res, next) => {
//   res.status(500).json({ error: err.message });
// });

// app.get('/api/llm/health', async (req, res) => {
//   const health = await checkProviderHealth()
//   res.json(health)
// })

// // TEMP TEST ROUTE — SSE stream test
// app.get('/api/test/stream', (req, res) => {
//   const sessionId = uuidv4()
//   const memory = createSession(sessionId)
//   createSSEStream(res, memory)

//   // Simulate agent activity after connection
//   setTimeout(() => memory.setAgentStatus('coordinator', 'thinking', 'Analyzing repository...'), 1000)
//   setTimeout(() => memory.setAgentStatus('coordinator', 'acting', 'Creating execution plan...'), 2500)
//   setTimeout(() => memory.setPlan({ steps: ['security', 'writer', 'architecture'], focus: 'Node.js API' }), 4000)
//   setTimeout(() => memory.setAgentStatus('security', 'thinking', 'Scanning for vulnerabilities...'), 5000)
//   setTimeout(() => memory.addBug({ id: '1', severity: 'critical', title: 'SQL Injection risk', file: 'db.js', line: 42, description: 'Unparameterized query', suggestedFix: 'Use prepared statements' }), 6500)
//   setTimeout(() => memory.addMessage('security', 'writer', 'Found 1 critical bug in db.js', 'context'), 7000)
//   setTimeout(() => memory.setStatus('complete'), 8000)
// })

// app.get('/api/test/prompts', (req, res) => {
//   const testSummary = {
//     owner: 'test', repo: 'myapp', projectType: 'Node.js API',
//     languages: { javascript: 4 }, securitySensitiveFiles: ['auth.js'],
//     totalFiles: 4, analyzedFiles: 4
//   }
//   const testFiles = [{ path: 'auth.js', language: 'javascript', size: 1200 }]
//   const prompt = buildPlanningPrompt(testSummary, testFiles)
  
//   res.json({ promptLength: prompt.length, promptPreview: prompt.substring(0, 300) })
// })

// app.listen(PORT, () => {
//   console.log(`AgentLens server running on port ${PORT}`);
// });

// app.get('/api/test/coordinator', async (req, res) => {
//   const sessionId = uuidv4()
//   const memory = createSession(sessionId)

//   // Set up test data in memory
//   memory.set('repoSummary', {
//     owner: 'testuser',
//     repo: 'express-api',
//     projectType: 'Node.js API',
//     languages: { javascript: 4 },
//     securitySensitiveFiles: ['auth.js', 'db.js'],
//     totalFiles: 4,
//     analyzedFiles: 4
//   })

//   memory.set('files', [
//     { path: 'server.js', language: 'javascript', size: 2400 },
//     { path: 'auth.js', language: 'javascript', size: 1800 },
//     { path: 'db.js', language: 'javascript', size: 1200 },
//     { path: 'utils.js', language: 'javascript', size: 800 }
//   ])

//   // Stream SSE so you can watch it happen
//   createSSEStream(res, memory)

//   // Run the coordinator
//   try {
//     const plan = await runPlanningPhase(memory)
//     console.log('Plan received:', JSON.stringify(plan, null, 2))
//   } catch (err) {
//     console.error('Coordinator failed:', err.message)
//   }
// })

// app.get('/api/test/security', async (req, res) => {
//   const sessionId = uuidv4()
//   const memory = createSession(sessionId)

//   // Load actual test sample files
//   const loadFile = (name) => {
//     try {
//       return readFileSync(join(__dirname, '../test-sample', name), 'utf-8')
//     } catch { return '' }
//   }

//   memory.set('repoSummary', {
//     owner: 'testuser', repo: 'express-api',
//     projectType: 'Node.js API', languages: { javascript: 2 },
//     securitySensitiveFiles: ['auth.js', 'db.js'],
//     totalFiles: 2, analyzedFiles: 2
//   })

//   memory.set('files', [
//     { path: 'auth.js', language: 'javascript', size: 800, content: loadFile('auth.js') },
//     { path: 'db.js', language: 'javascript', size: 600, content: loadFile('db.js') }
//   ])

//   // Stream so you can watch live
//   createSSEStream(res, memory)

//   try {
//     // Run coordinator first to get a plan
//     await runPlanningPhase(memory)
//     // Then run security agent
//     await runSecurityAnalysis(memory)
//     const stats = getSecurityStats(memory)
//     console.log('Security stats:', stats)
//   } catch (err) {
//     console.error('Test failed:', err.message)
//   }
// })


// app.get('/api/test/writer', async (req, res) => {
//   const sessionId = uuidv4()
//   const memory = createSession(sessionId)

//   const loadFile = (name) => {
//     try { return readFileSync(join(__dirname, '../test-sample', name), 'utf-8') } 
//     catch { return '' }
//   }

//   memory.set('repoSummary', {
//     owner: 'testuser', repo: 'express-api',
//     projectType: 'Node.js API', languages: { javascript: 3 },
//     securitySensitiveFiles: ['auth.js', 'db.js'],
//     totalFiles: 3, analyzedFiles: 3
//   })

//   memory.set('files', [
//     { path: 'server.js', language: 'javascript', size: 900, content: loadFile('server.js') },
//     { path: 'auth.js', language: 'javascript', size: 800, content: loadFile('auth.js') },
//     { path: 'db.js', language: 'javascript', size: 600, content: loadFile('db.js') }
//   ])

//   createSSEStream(res, memory)

//   try {
//     await runPlanningPhase(memory)
//     await runSecurityAnalysis(memory)
//     await runTechnicalWriter(memory)

//     // Print the generated docs to terminal
//     const docs = memory.get('documentation')
//     console.log('\n====== GENERATED DOCUMENTATION ======')
//     console.log(docs.substring(0, 800))
//     console.log('... [truncated] ...\n')
//   } catch (err) {
//     console.error('Test failed:', err.message)
//   }
// })


// app.get('/api/test/full', async (req, res) => {
//   const sessionId = uuidv4()
//   const memory = createSession(sessionId)

//   const loadFile = (name) => {
//     try { return readFileSync(join(__dirname, '../test-sample', name), 'utf-8') }
//     catch { return '' }
//   }

//   memory.set('repoSummary', {
//     owner: 'testuser', repo: 'express-api',
//     projectType: 'Node.js API', languages: { javascript: 3 },
//     securitySensitiveFiles: ['auth.js', 'db.js'],
//     totalFiles: 3, analyzedFiles: 3
//   })

//   memory.set('files', [
//     { path: 'server.js', language: 'javascript', size: 900, content: loadFile('server.js') },
//     { path: 'auth.js', language: 'javascript', size: 800, content: loadFile('auth.js') },
//     { path: 'db.js', language: 'javascript', size: 600, content: loadFile('db.js') }
//   ])

//   createSSEStream(res, memory)

//   try {
//     await runPlanningPhase(memory)
//     await runSecurityAnalysis(memory)
//     await runTechnicalWriter(memory)
//     await runArchitectureReview(memory)

//     // Print final state
//     const refactors = memory.get('refactors')
//     const archResult = memory.get('architectureResult')
//     console.log(`\n====== ARCHITECTURE COMPLETE ======`)
//     console.log(`Suggestions: ${refactors.length}`)
//     console.log(`Architecture score: ${archResult?.architectureScore}/100`)
//     console.log(`Quick wins: ${archResult?.quickWins?.join(', ')}`)
//     refactors.forEach(r => {
//       console.log(`  🔧 [${r.impact.toUpperCase()}] ${r.title}`)
//       if (r.preventsBugIds?.length > 0) console.log(`     └─ Prevents: ${r.preventsBugIds.join(', ')}`)
//     })
//   } catch (err) {
//     console.error('Full pipeline test failed:', err.message)
//   }
// })



// Testing variant of the Index.js end


















