import { supabase } from './supabase.js'

// Get user by Clerk ID. Returns user object or null.
export async function getUserById(clerkUserId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get user: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`getUserById failed: ${err.message}`)
  }
}

// Create or update user from Clerk JWT payload.
// clerkPayload has: { sub, email, name } (sub is the Clerk user ID)
// If user exists, update email/name. If not, create with plan='free'.
// Returns the user object.
export async function upsertUser(clerkPayload) {
  try {
    const { sub, email, name } = clerkPayload

    if (!sub || !email) {
      throw new Error('Missing required fields: sub and email are required')
    }

    const existingUser = await getUserById(sub)

    if (existingUser) {
      const { data, error } = await supabase
        .from('users')
        .update({
          email,
          name,
          updated_at: new Date().toISOString()
        })
        .eq('id', sub)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`)
      }

      return data
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: sub,
          email,
          name,
          plan: 'free',
          analyses_this_month: 0,
          month_reset_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`)
      }

      return data
    }
  } catch (err) {
    throw new Error(`upsertUser failed: ${err.message}`)
  }
}

// Check if user can run an analysis.
// Free plan: max 5 per month. Pro plan: unlimited.
// Resets count if month_reset_date is > 30 days ago.
// Returns { allowed: boolean, reason: string, used: number, limit: number }
export async function checkAnalysisQuota(clerkUserId) {
  try {
    const user = await getUserById(clerkUserId)

    if (!user) {
      throw new Error('User not found')
    }

    const monthResetDate = new Date(user.month_reset_date)
    const now = new Date()
    const daysSinceReset = (now - monthResetDate) / (1000 * 60 * 60 * 24)

    let analysesThisMonth = user.analyses_this_month

    if (daysSinceReset > 30) {
      const { error } = await supabase
        .from('users')
        .update({
          analyses_this_month: 0,
          month_reset_date: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', clerkUserId)

      if (error) {
        throw new Error(`Failed to reset month: ${error.message}`)
      }

      analysesThisMonth = 0
    }

    const isPro = user.plan === 'pro'
    const limit = isPro ? Infinity : 5
    const allowed = isPro || analysesThisMonth < limit

    let reason
    if (allowed) {
      reason = isPro ? 'Pro plan: unlimited analyses' : `${limit - analysesThisMonth} analyses remaining this month`
    } else {
      reason = 'Monthly analysis limit reached. Upgrade to Pro for unlimited analyses.'
    }

    return {
      allowed,
      reason,
      used: analysesThisMonth,
      limit
    }
  } catch (err) {
    throw new Error(`checkAnalysisQuota failed: ${err.message}`)
  }
}

// Increment analyses_this_month by 1 for the user.
export async function incrementAnalysisCount(clerkUserId) {
  try {
    const user = await getUserById(clerkUserId)

    if (!user) {
      throw new Error('User not found')
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        analyses_this_month: user.analyses_this_month + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', clerkUserId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to increment analysis count: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`incrementAnalysisCount failed: ${err.message}`)
  }
}

// Update user plan. plan must be 'free' or 'pro'.
export async function updateUserPlan(clerkUserId, plan) {
  try {
    if (plan !== 'free' && plan !== 'pro') {
      throw new Error('Plan must be either "free" or "pro"')
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', clerkUserId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`updateUserPlan failed: ${err.message}`)
  }
}

// Get user's stored API keys (returns array, keys are masked except last 4 chars)
export async function getUserApiKeys(clerkUserId) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', clerkUserId)

    if (error) {
      throw new Error(`Failed to get API keys: ${error.message}`)
    }

    const maskedKeys = (data || []).map(key => {
      const masked = { ...key }
      if (masked.encrypted_key) {
        const lastFour = masked.encrypted_key.slice(-4)
        masked.encrypted_key = `****${lastFour}`
      }
      return masked
    })

    return maskedKeys
  } catch (err) {
    throw new Error(`getUserApiKeys failed: ${err.message}`)
  }
}

// Save or update an API key for a provider.
// providerData: { provider, encrypted_key?, ollama_url?, model_name? }
export async function upsertApiKey(clerkUserId, providerData) {
  try {
    const { provider, encrypted_key, ollama_url, model_name } = providerData

    if (!provider) {
      throw new Error('Provider is required')
    }

    const { data: existing } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', clerkUserId)
      .eq('provider', provider)
      .single()

    if (existing) {
      const updateData = {
        updated_at: new Date().toISOString()
      }
      if (encrypted_key !== undefined) updateData.encrypted_key = encrypted_key
      if (ollama_url !== undefined) updateData.ollama_url = ollama_url
      if (model_name !== undefined) updateData.model_name = model_name

      const { data, error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('user_id', clerkUserId)
        .eq('provider', provider)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update API key: ${error.message}`)
      }

      return data
    } else {
      const insertData = {
        user_id: clerkUserId,
        provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      if (encrypted_key !== undefined) insertData.encrypted_key = encrypted_key
      if (ollama_url !== undefined) insertData.ollama_url = ollama_url
      if (model_name !== undefined) insertData.model_name = model_name

      const { data, error } = await supabase
        .from('api_keys')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to insert API key: ${error.message}`)
      }

      return data
    }
  } catch (err) {
    throw new Error(`upsertApiKey failed: ${err.message}`)
  }
}
