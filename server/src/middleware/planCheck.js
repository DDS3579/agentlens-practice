import { getUserById, checkAnalysisQuota } from '../db/userService.js'

// Requires user to be on pro plan.
// Attaches req.userRecord = full user object from DB.
// Returns 403 with { error: 'Pro plan required', upgrade: true } if free user.
export async function requirePro(req, res, next) {
  try {
    const user = await getUserById(req.auth.userId)
    req.userRecord = user

    if (!user) {
      return next()
    }

    if (user.plan !== 'pro') {
      console.warn(`Plan check failed: User ${req.auth.userId} requires pro plan`)
      return res.status(403).json({ error: 'Pro plan required', upgrade: true })
    }

    next()
  } catch (error) {
    console.error('requirePro error:', error.message)
    return res.status(500).json({ error: 'Failed to check plan status' })
  }
}

// Checks analysis quota for free users.
// Pro users always pass through.
// Free users: checks checkAnalysisQuota(userId).
// If not allowed: returns 429 with { error, limit, used, upgrade: true }
// If allowed: calls next()
// Always attaches req.userRecord and req.quotaInfo to the request.
export async function checkQuota(req, res, next) {
  try {
    const user = await getUserById(req.auth.userId)
    req.userRecord = user

    if (!user) {
      req.quotaInfo = null
      return next()
    }

    const quotaInfo = await checkAnalysisQuota(req.auth.userId)
    req.quotaInfo = quotaInfo

    if (!quotaInfo.allowed) {
      console.warn(`Quota check failed: User ${req.auth.userId} has reached limit (${quotaInfo.used}/${quotaInfo.limit})`)
      return res.status(429).json({
        error: quotaInfo.reason,
        limit: quotaInfo.limit,
        used: quotaInfo.used,
        upgrade: true
      })
    }

    next()
  } catch (error) {
    console.error('checkQuota error:', error.message)
    return res.status(500).json({ error: 'Failed to check quota' })
  }
}

// Attaches user record to req.userRecord without blocking.
// Always calls next() even if user fetch fails.
export async function attachUser(req, res, next) {
  try {
    const user = await getUserById(req.auth.userId)
    req.userRecord = user
  } catch (error) {
    console.error('attachUser error:', error.message)
    req.userRecord = null
  }
  next()
}
