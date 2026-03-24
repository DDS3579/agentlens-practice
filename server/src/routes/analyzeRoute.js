import { Router } from 'express'
import { optionalAuth, syncUser, attachLLMConfig } from '../middleware/auth.js'
import { runAnalysisPipeline } from '../orchestration/pipeline.js'
import { createSSEStream, sendSSEEvent, setupSSEHeaders, sendError } from '../streaming/sseEmitter.js'
import { parseRepoUrl, fetchRepoFiles, getRepoTree } from '../github/githubService.js'
import { summarizeRepo } from '../github/repoParser.js'

const router = Router()

// POST /analyze
// Client sends: { url, selectedPaths?: string[] }
// Server fetches the repo, runs the pipeline, streams SSE events
router.post('/', optionalAuth, syncUser, attachLLMConfig, async (req, res) => {
  // Set up SSE headers
  setupSSEHeaders(res)

  const { url, selectedPaths } = req.body

  if (!url) {
    sendError(res, 'GitHub repository URL is required')
    return
  }

  try {
    // Step 1 — Parse the URL
    const { owner, repo, branch } = parseRepoUrl(url)

    // Step 2 — Send pipeline_start event
    sendSSEEvent(res, 'pipeline_start', {
      message: `Accessing ${owner}/${repo}...`,
      owner,
      repo
    })

    // Step 3 — Fetch repo tree and files
    const treeItems = await getRepoTree(owner, repo, branch)
    const files = await fetchRepoFiles(owner, repo, branch, selectedPaths || [])
    const repoSummary = summarizeRepo(owner, repo, branch, treeItems, files)

    // Step 4 — Send repo_ready event
    sendSSEEvent(res, 'repo_ready', {
      summary: { ...repoSummary, files },
      filesCount: files.length
    })

    // Step 5 — Run the analysis pipeline
    // The pipeline calls onSession(sessionId, memory) once session is created.
    // We wire the SSE stream to memory events in that callback.
    let cleanup = null

    const onSession = (sessionId, memory) => {
      // Send session_created event
      sendSSEEvent(res, 'session_created', { sessionId })

      // Wire SSE emitter to memory events (agent_status, agent_finding, etc.)
      cleanup = createSSEStream(res, memory)
    }

    const results = await runAnalysisPipeline(files, repoSummary, onSession, req.llmConfig, res)

    // Step 6 — Send final_results event
    sendSSEEvent(res, 'final_results', results)

  } catch (error) {
    console.error('Analysis pipeline error:', error)
    sendSSEEvent(res, 'error', {
      error: error.message || 'Analysis failed',
      message: error.message || 'Analysis failed'
    })
  } finally {
    // End the SSE stream
    if (!res.writableEnded) {
      res.end()
    }
  }
})

export default router