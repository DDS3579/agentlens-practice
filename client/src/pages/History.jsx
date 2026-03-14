import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Bug, FileCode, ExternalLink, Trash2, Zap, GitBranch, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function History() {
  const [analyses, setAnalyses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const { getToken, isPro, userProfile } = useAuth()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setAnalyses(data.analyses || [])
    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (analysisId) => {
    if (confirmDeleteId !== analysisId) {
      setConfirmDeleteId(analysisId)
      setTimeout(() => {
        setConfirmDeleteId(null)
      }, 2000)
      return
    }

    try {
      setDeletingId(analysisId)
      const token = await getToken()

      const response = await fetch(`/api/history/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete analysis')
      }

      setAnalyses((prev) => prev.filter((a) => a.id !== analysisId))
    } catch (err) {
      console.error('Error deleting analysis:', err)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const formatDuration = (ms) => {
    if (!ms) return '0s'
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
      case 'running':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Running</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
          <p className="text-gray-400 mt-1">
            {isPro
              ? 'View all your past analyses'
              : `Showing last ${analyses.length} of your analyses`
            }
          </p>
        </div>

        {/* Free Plan Banner */}
        {!isPro && (
          <motion.div
            className="bg-purple-950/50 border border-purple-500/30 rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Free plan shows last 3 analyses</p>
                  <p className="text-purple-300 text-sm">Upgrade for unlimited history</p>
                </div>
              </div>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/billing">
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-950/50 border-red-500/30 mb-6">
            <CardContent className="py-4">
              <p className="text-red-400">Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-900 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48 bg-gray-800" />
                      <Skeleton className="h-4 w-64 bg-gray-800" />
                    </div>
                    <Skeleton className="h-6 w-20 bg-gray-800" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && analyses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gray-900 border-white/10 border-dashed">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <FileCode className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No analyses yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start analyzing a repository to see your history here
                  </p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/dashboard">
                      Start Analyzing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analysis Cards */}
        {!isLoading && analyses.length > 0 && (
          <div className="space-y-4">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border-white/10 hover:border-purple-500/30 transition-colors">
                  <CardContent className="p-6">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {analysis.repo_name || 'Unknown Repository'}
                        </h3>
                        <p className="text-gray-500 text-sm truncate max-w-md">
                          {analysis.repo_url}
                        </p>
                      </div>
                      {getStatusBadge(analysis.status)}
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Bug className="w-4 h-4 text-red-400" />
                        <span>{analysis.bug_count || 0} bugs</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span>{analysis.file_count || 0} files</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>{formatDuration(analysis.duration_ms)}</span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-gray-500 text-sm">
                        {analysis.created_at
                          ? formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })
                          : 'Unknown date'
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(analysis.id)}
                          disabled={deletingId === analysis.id}
                          className={`text-gray-400 hover:text-red-400 hover:bg-red-500/10 ${
                            confirmDeleteId === analysis.id ? 'text-red-400 bg-red-500/10' : ''
                          }`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {confirmDeleteId === analysis.id ? 'Sure?' : 'Delete'}
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Link to={`/analysis/${analysis.id}`}>
                            View Analysis
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default History
