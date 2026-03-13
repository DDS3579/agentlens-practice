import express from 'express';
import { parseRepoUrl, fetchRepoFiles, getRepoTree } from '../github/githubService.js';
import { summarizeRepo, buildFileTree } from '../github/repoParser.js';
import { runAnalysisPipeline, getPipelineStatus } from '../orchestration/pipeline.js';
import { createSSEStream, sendError } from '../streaming/sseEmitter.js';
import { getSession } from '../memory/sharedMemory.js';

// Attaches SharedMemory events to an already-open SSE response
// Does NOT set headers (they're already set)
function attachMemoryToStream(res, memory) {
  const send = (eventName, data) => {
    if (!res.writableEnded) {
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
    }
  }

  // Keepalive
  const keepalive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keepalive\n\n')
    } else {
      clearInterval(keepalive)
    }
  }, 15000)

  memory.on('agent:status', (data) => send('agent_status', data))
  memory.on('agent:finding', (data) => send('agent_finding', data))
  memory.on('agent:communication', (data) => send('agent_communication', data))
  memory.on('coordinator:plan', (data) => send('coordinator_plan', data))
  memory.on('session:status', (data) => {
    send('session_status', data)
    if (data.status === 'complete' || data.status === 'error') {
      send('analysis_complete', memory.getSnapshot())
      clearInterval(keepalive)
    }
  })
  memory.on('session:error', (data) => send('session_error', data))

  res.on('close', () => {
    clearInterval(keepalive)
    memory.emitter.removeAllListeners()
    console.log(`SSE client disconnected: ${memory.get('sessionId')}`)
  })
}

const router = express.Router();

/**
 * POST /api/analyze
 * Main analysis endpoint - accepts repo URL and streams results via SSE
 */
router.post('/', async (req, res) => {
  const { url, selectedPaths, branch } = req.body

  if (!url) {
    return res.status(400).json({ error: 'GitHub repository URL is required' })
  }

  // Handle client disconnect
  req.on('close', () => console.log('Client disconnected from analysis stream'))

  try {
    // Step 1: Parse URL
    const { owner, repo, branch: detectedBranch } = parseRepoUrl(url)
    const repoBranch = branch || detectedBranch

    // Step 2: Set SSE headers NOW — before any await that sends data
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    // Step 3: Send initial status
    res.write('event: pipeline_start\ndata: ' + JSON.stringify({
      message: `Accessing ${owner}/${repo}...`,
      owner, repo, branch: repoBranch
    }) + '\n\n')

    // Step 4: Fetch file tree
    const treeItems = await getRepoTree(owner, repo, repoBranch)

    res.write('event: pipeline_start\ndata: ' + JSON.stringify({
      message: `Fetching files...`,
    }) + '\n\n')

    // Step 5: Fetch files with cap
    const fetchPromise = fetchRepoFiles(owner, repo, repoBranch, selectedPaths || [])
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('File fetch timed out after 30s')), 30000)
    )
    const files = await Promise.race([fetchPromise, timeoutPromise])

    if (files.length === 0) {
      res.write('event: error\ndata: ' + JSON.stringify({
        error: 'No analyzable files found in repository'
      }) + '\n\n')
      res.end()
      return
    }

    // Step 6: Build repo summary
    const repoSummary = await summarizeRepo(owner, repo, repoBranch, treeItems, files)

    res.write('event: repo_ready\ndata: ' + JSON.stringify({
      summary: repoSummary,
      filesCount: files.length
    }) + '\n\n')

    // Step 7: Run pipeline
    // IMPORTANT: onSession callback must NOT call setupSSEHeaders again
    // We pass the already-open res directly — createSSEStream will skip header setup
    const finalResults = await runAnalysisPipeline(
      files,
      repoSummary,
      (sessionId, memory) => {
        // Attach memory events to the already-open SSE stream
        // WITHOUT calling setupSSEHeaders again
        attachMemoryToStream(res, memory)

        res.write('event: session_created\ndata: ' + JSON.stringify({
          sessionId
        }) + '\n\n')
      }
    )

    if (!res.writableEnded) {
      res.write('event: final_results\ndata: ' + JSON.stringify(finalResults) + '\n\n')
      res.end()
    }

  } catch (error) {
    console.error('Analysis route error:', error)
    if (!res.writableEnded) {
      res.write('event: error\ndata: ' + JSON.stringify({
        error: error.message || 'Analysis failed'
      }) + '\n\n')
      res.end()
    }
  }
})

/**
 * GET /api/analyze/status/:sessionId
 * Get current pipeline status for a session
 */
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const status = getPipelineStatus(sessionId);

  if (!status.found) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(status);
});

/**
 * GET /api/analyze/health
 * Health check for this route
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    route: 'analyze',
    timestamp: new Date().toISOString()
  });
});

export default router;
