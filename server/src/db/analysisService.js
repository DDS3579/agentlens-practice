
import { supabase } from './supabase.js'

// Save a new analysis
export async function saveAnalysis(userId, repoUrl, repoName, results) {
  const bugCount = results?.bugs?.length || 0
  const fileCount = results?.summary?.filesAnalyzed || 0
  const durationMs = results?.summary?.durationMs || null

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      repo_url: repoUrl,
      repo_name: repoName,
      status: 'completed',
      results: results,
      bug_count: bugCount,
      file_count: fileCount,
      duration_ms: durationMs
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving analysis:', error)
    throw error
  }

  return data
}

// Get all analyses for a user (without full results for list view)
export async function getUserAnalyses(userId, limit = 50) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, repo_url, repo_name, status, bug_count, file_count, duration_ms, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user analyses:', error)
    throw error
  }

  return data || []
}

// Get a single analysis by ID (with full results)
export async function getAnalysisById(analysisId, userId) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching analysis:', error)
    throw error
  }

  return data
}

// Delete an analysis
export async function deleteAnalysis(analysisId, userId) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', analysisId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting analysis:', error)
    throw error
  }

  return true
}

// Update analysis status
export async function updateAnalysisStatus(analysisId, status, results = null) {
  const updateData = { status }
  
  if (results) {
    updateData.results = results
    updateData.bug_count = results?.bugs?.length || 0
    updateData.file_count = results?.summary?.filesAnalyzed || 0
    updateData.duration_ms = results?.summary?.durationMs || null
  }

  const { data, error } = await supabase
    .from('analyses')
    .update(updateData)
    .eq('id', analysisId)
    .select()
    .single()

  if (error) {
    console.error('Error updating analysis status:', error)
    throw error
  }

  return data
}

// Create a pending analysis (before processing starts)
export async function createPendingAnalysis(userId, repoUrl, repoName) {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      repo_url: repoUrl,
      repo_name: repoName,
      status: 'running',
      results: null,
      bug_count: 0,
      file_count: 0,
      duration_ms: null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating pending analysis:', error)
    throw error
  }

  return data
}

// Get analysis count for a user
export async function getAnalysisCount(userId) {
  const { count, error } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting analyses:', error)
    throw error
  }

  return count || 0
}

// Search user's analyses by repo name or URL
// query: search string
// userId: string
// Returns array of matching analyses (without results JSONB)
export async function searchAnalyses(userId, query) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, repo_url, repo_name, status, bug_count, file_count, duration_ms, created_at')
    .eq('user_id', userId)
    .or(`repo_name.ilike.%${query}%,repo_url.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching analyses:', error)
    throw error
  }

  return data || []
}
