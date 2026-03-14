//  Code V1 Start


// import { Router } from 'express'
// import { requireAuth, syncUser } from '../middleware/auth.js'
// import { attachUser } from '../middleware/planCheck.js'
// import { getUserAnalyses, getAnalysisById, deleteAnalysis } from '../db/analysisService.js'

// const router = Router()

// // GET / - fetch user's analysis history
// router.get('/', requireAuth, syncUser, attachUser, async (req, res) => {
//   try {
//     const plan = req.userRecord?.plan || 'free'
//     const analyses = await getUserAnalyses(req.auth.userId, plan)

//     return res.json({
//       analyses,
//       plan,
//       total: analyses.length
//     })
//   } catch (error) {
//     console.error('Failed to fetch history:', error.message)
//     return res.status(500).json({ error: 'Failed to fetch analysis history' })
//   }
// })

// // GET /:id - fetch single analysis with full results
// router.get('/:id', requireAuth, syncUser, attachUser, async (req, res) => {
//   try {
//     const analysis = await getAnalysisById(req.params.id, req.auth.userId)

//     if (!analysis) {
//       return res.status(404).json({ error: 'Analysis not found' })
//     }

//     return res.json({ analysis })
//   } catch (error) {
//     console.error('Failed to fetch analysis:', error.message)
//     return res.status(500).json({ error: 'Failed to fetch analysis' })
//   }
// })

// // DELETE /:id - delete an analysis
// router.delete('/:id', requireAuth, syncUser, attachUser, async (req, res) => {
//   try {
//     const deleted = await deleteAnalysis(req.params.id, req.auth.userId)

//     if (!deleted) {
//       return res.status(404).json({ error: 'Analysis not found' })
//     }

//     return res.json({ success: true })
//   } catch (error) {
//     console.error('Failed to delete analysis:', error.message)
//     return res.status(500).json({ error: 'Failed to delete analysis' })
//   }
// })

// export default router


// Code V1 end



// Code V2 Start

import { Router } from 'express'
import { requireAuth, syncUser } from '../middleware/auth.js'
import { attachUser, checkQuota } from '../middleware/planCheck.js'
import { getUserAnalyses, getAnalysisById, deleteAnalysis, createAnalysis, completeAnalysis } from '../db/analysisService.js'
import { incrementAnalysisCount } from '../db/userService.js'

const router = Router()

// POST /save - save a new analysis
router.post('/save', requireAuth, syncUser, checkQuota, attachUser, async (req, res) => {
  try {
    const { repoUrl, repoName, results, fileCount, bugCount, durationMs } = req.body

    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' })
    }

    // Create the analysis record
    const analysis = await createAnalysis(req.auth.userId, repoUrl, repoName || '')

    // Complete the analysis with results
    await completeAnalysis(analysis.id, results, fileCount || 0, bugCount || 0, durationMs || 0)

    // Increment the user's analysis count
    await incrementAnalysisCount(req.auth.userId)

    return res.json({ success: true, analysisId: analysis.id })
  } catch (error) {
    console.error('Failed to save analysis:', error.message)
    return res.status(500).json({ error: 'Failed to save analysis' })
  }
})

// GET / - fetch user's analysis history
router.get('/', requireAuth, syncUser, attachUser, async (req, res) => {
  try {
    const plan = req.userRecord?.plan || 'free'
    const analyses = await getUserAnalyses(req.auth.userId, plan)

    return res.json({
      analyses,
      plan,
      total: analyses.length
    })
  } catch (error) {
    console.error('Failed to fetch history:', error.message)
    return res.status(500).json({ error: 'Failed to fetch analysis history' })
  }
})

// GET /:id - fetch single analysis with full results
router.get('/:id', requireAuth, syncUser, attachUser, async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id, req.auth.userId)

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    return res.json({ analysis })
  } catch (error) {
    console.error('Failed to fetch analysis:', error.message)
    return res.status(500).json({ error: 'Failed to fetch analysis' })
  }
})

// DELETE /:id - delete an analysis
router.delete('/:id', requireAuth, syncUser, attachUser, async (req, res) => {
  try {
    const deleted = await deleteAnalysis(req.params.id, req.auth.userId)

    if (!deleted) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete analysis:', error.message)
    return res.status(500).json({ error: 'Failed to delete analysis' })
  }
})

export default router

// Code V2 end
