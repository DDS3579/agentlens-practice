import { supabase } from './supabase.js'

// Create a new analysis record with status 'running'.
// Returns the created analysis object with its generated id.
export async function createAnalysis(userId, repoUrl, repoName) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        repo_url: repoUrl,
        repo_name: repoName,
        status: 'running',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create analysis: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`createAnalysis failed: ${err.message}`)
  }
}

// Update analysis to 'completed' with full results.
// results shape: { plan, bugs, documentation, refactors, summary }
// Also sets completed_at, bug_count, file_count, duration_ms.
export async function completeAnalysis(analysisId, results, fileCount, bugCount, durationMs) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .update({
        status: 'completed',
        results,
        file_count: fileCount,
        bug_count: bugCount,
        duration_ms: durationMs,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to complete analysis: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`completeAnalysis failed: ${err.message}`)
  }
}

// Update analysis status to 'failed' with an error message stored in results.
export async function failAnalysis(analysisId, errorMessage) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .update({
        status: 'failed',
        results: { error: errorMessage },
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to fail analysis: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`failAnalysis failed: ${err.message}`)
  }
}

// Get all analyses for a user, ordered by created_at DESC.
// Free plan: returns last 3 only. Pro plan: returns all.
// plan param: 'free' | 'pro'
export async function getUserAnalyses(userId, plan) {
  try {
    const limit = plan === 'pro' ? 100 : 3

    const { data, error } = await supabase
      .from('analyses')
      .select('id, repo_url, repo_name, status, bug_count, file_count, duration_ms, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get user analyses: ${error.message}`)
    }

    return data || []
  } catch (err) {
    throw new Error(`getUserAnalyses failed: ${err.message}`)
  }
}

// Get a single analysis by ID.
// Returns null if not found or doesn't belong to userId.
export async function getAnalysisById(analysisId, userId) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get analysis: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`getAnalysisById failed: ${err.message}`)
  }
}

// Delete an analysis. Only deletes if it belongs to userId.
export async function deleteAnalysis(analysisId, userId) {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to delete analysis: ${error.message}`)
    }

    return data
  } catch (err) {
    throw new Error(`deleteAnalysis failed: ${err.message}`)
  }
}
