
import express from 'express'
import { requireAuth, syncUser } from '../middleware/auth.js'
import { attachUser } from '../middleware/planCheck.js'
import { 
  getUserAnalyses, 
  getAnalysisById, 
  deleteAnalysis,
  saveAnalysis,
  searchAnalyses 
} from '../db/analysisService.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)
router.use(syncUser)
router.use(attachUser)

// GET /api/history - Get all analyses for current user
router.get('/', async (req, res) => {
  try {
    const analyses = await getUserAnalyses(req.auth.userId)
    res.json({ analyses })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'Failed to fetch analysis history' })
  }
})

// POST /api/history/save - Save a new analysis (called by agentStore auto-save)
router.post('/save', async (req, res) => {
  try {
    const { repoUrl, repoName, results, fileCount, bugCount, durationMs } = req.body

    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' })
    }

    const analysis = await saveAnalysis(
      req.auth.userId,
      repoUrl,
      repoName || repoUrl.split('/').slice(-2).join('/'),
      {
        ...results,
        summary: {
          ...(results?.summary || {}),
          filesAnalyzed: fileCount || 0,
          durationMs: durationMs || 0
        },
        bugs: results?.bugs?.bugs || results?.bugs || [],
        bugCount: bugCount || 0
      }
    )

    res.json({ success: true, analysis })
  } catch (error) {
    console.error('Error saving analysis:', error)
    res.status(500).json({ error: 'Failed to save analysis' })
  }
})

// GET /api/history/search?q=query - Search analyses by repo name or URL
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || ''
    
    if (!query || query.length < 2) {
      return res.json({ analyses: [] })
    }
    
    const analyses = await searchAnalyses(req.auth.userId, query)
    res.json({ analyses })
  } catch (error) {
    console.error('Error searching analyses:', error)
    res.status(500).json({ error: 'Failed to search analyses' })
  }
})

// GET /api/history/:id - Get a single analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id, req.auth.userId)
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }
    
    res.json({ analysis })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    res.status(500).json({ error: 'Failed to fetch analysis' })
  }
})

// GET /api/history/:id/export - Export analysis documentation as markdown file
router.get('/:id/export', async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id, req.auth.userId)
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }
    
    const documentation = analysis.results?.documentation
    
    if (!documentation) {
      return res.status(404).json({ error: 'No documentation available for this analysis' })
    }
    
    const repoName = analysis.repo_name || analysis.repo_url?.split('/').slice(-2).join('-') || 'analysis'
    const sanitizedRepoName = repoName.replace(/[^a-zA-Z0-9-_]/g, '-')
    
    res.setHeader('Content-Type', 'text/markdown')
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedRepoName}-analysis.md"`)
    res.send(documentation)
  } catch (error) {
    console.error('Error exporting analysis:', error)
    res.status(500).json({ error: 'Failed to export analysis' })
  }
})

// DELETE /api/history/:id - Delete an analysis
router.delete('/:id', async (req, res) => {
  try {
    await deleteAnalysis(req.params.id, req.auth.userId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    res.status(500).json({ error: 'Failed to delete analysis' })
  }
})

export default router
