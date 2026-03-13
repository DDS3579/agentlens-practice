import express from 'express';
import { parseRepoUrl, fetchRepoFiles, getRepoTree } from '../github/githubService.js';
import { summarizeRepo, buildFileTree } from '../github/repoParser.js';
import { runAnalysisPipeline, getPipelineStatus } from '../orchestration/pipeline.js';
import { createSSEStream, sendError } from '../streaming/sseEmitter.js';
import { getSession } from '../memory/sharedMemory.js';

const router = express.Router();

/**
 * POST /api/analyze
 * Main analysis endpoint - accepts repo URL and streams results via SSE
 */
router.post('/', async (req, res) => {
  const { url, selectedPaths, branch: requestBranch } = req.body;

  // a. Validate request body
  if (!url) {
    return res.status(400).json({ error: 'GitHub repository URL is required' });
  }

  // b. Set up SSE headers IMMEDIATELY before doing anything else
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected from analysis stream');
  });

  // Send initial event
  res.write('event: pipeline_start\ndata: ' + JSON.stringify({
    message: 'Fetching repository...',
    timestamp: Date.now()
  }) + '\n\n');

  // c. Wrap everything else in try/catch
  try {
    // Step 1: Parse URL
    const parsed = parseRepoUrl(url);
    const owner = parsed.owner;
    const repo = parsed.repo;
    const branch = requestBranch || parsed.branch || 'main';

    // Step 2: Send status update
    res.write('event: pipeline_start\ndata: ' + JSON.stringify({
      message: `Accessing ${owner}/${repo}...`,
      owner,
      repo,
      branch
    }) + '\n\n');

    // Step 3: Fetch file tree
    const treeItems = await getRepoTree(owner, repo, branch);

    // Step 4: Fetch actual file contents
    res.write('event: pipeline_start\ndata: ' + JSON.stringify({
      message: `Fetching ${selectedPaths?.length || 'all'} files...`
    }) + '\n\n');

    const files = await fetchRepoFiles(owner, repo, branch, selectedPaths || []);

    if (files.length === 0) {
      res.write('event: error\ndata: ' + JSON.stringify({
        error: 'No analyzable files found in repository'
      }) + '\n\n');
      res.end();
      return;
    }

    // Step 5: Build repo summary
    const repoSummary = await summarizeRepo(owner, repo, branch, treeItems, files);

    // Step 6: Send repo info to frontend
    res.write('event: repo_ready\ndata: ' + JSON.stringify({
      summary: repoSummary,
      filesCount: files.length
    }) + '\n\n');

    // Step 7: Run the pipeline
    let finalResults = null;

    finalResults = await runAnalysisPipeline(
      files,
      repoSummary,
      (sessionId, memory) => {
        // Attach SSE stream to this memory instance
        createSSEStream(res, memory);

        // Send session ID to frontend
        res.write('event: session_created\ndata: ' + JSON.stringify({
          sessionId
        }) + '\n\n');
      }
    );

    // Step 8: Send final results
    if (!res.writableEnded) {
      res.write('event: final_results\ndata: ' + JSON.stringify(finalResults) + '\n\n');
      res.end();
    }

  } catch (error) {
    console.error('Analysis route error:', error);
    if (!res.writableEnded) {
      res.write('event: error\ndata: ' + JSON.stringify({
        error: error.message || 'Analysis failed'
      }) + '\n\n');
      res.end();
    }
  }
});

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
