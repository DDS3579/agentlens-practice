import { createClerkClient } from '@clerk/backend'
import { upsertUser } from '../db/userService.js'

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

// Main auth middleware
// Verifies Bearer token, attaches req.auth = { userId, email, name }
// Returns 401 if token missing or invalid
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const token = authHeader.substring(7)

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const payload = await clerkClient.verifyToken(token)
    const user = await clerkClient.users.getUser(payload.sub)

    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const name = `${firstName} ${lastName}`.trim()

    req.auth = {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: name || null
    }

    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Optional auth middleware  
// Same as requireAuth but calls next() even if no token
// Attaches req.auth = null if not authenticated
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null
      return next()
    }

    const token = authHeader.substring(7)

    if (!token) {
      req.auth = null
      return next()
    }

    const payload = await clerkClient.verifyToken(token)
    const user = await clerkClient.users.getUser(payload.sub)

    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const name = `${firstName} ${lastName}`.trim()

    req.auth = {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: name || null
    }

    next()
  } catch (error) {
    console.error('Optional auth error:', error.message)
    req.auth = null
    next()
  }
}

// Sync user to our Supabase DB after verifying auth
// Call upsertUser from userService with req.auth data
export async function syncUser(req, res, next) {
  try {
    if (req.auth) {
      await upsertUser({
        sub: req.auth.userId,
        email: req.auth.email,
        name: req.auth.name
      })
    }
    next()
  } catch (error) {
    console.error('Sync user error:', error.message)
    next()
  }
}
