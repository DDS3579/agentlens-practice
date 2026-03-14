import { Router } from 'express'
import { requireAuth, syncUser } from '../middleware/auth.js'
import { getUserById } from '../db/userService.js'

const router = Router()

// GET /profile
router.get('/profile', requireAuth, syncUser, async (req, res) => {
  try {
    const user = await getUserById(req.auth.userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ user })
  } catch (error) {
    console.error('Failed to fetch profile:', error.message)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

export default router