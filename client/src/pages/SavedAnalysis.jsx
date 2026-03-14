import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import useAgentStore from '../store/agentStore.js'
import ResultsTabs from '../components/results/ResultsTabs.jsx'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bug, FileCode, Clock, ExternalLink, GitBranch, Calendar } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

function SavedAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const { getToken } = useAuth()

  // Get store actions to populate results
  const {
    setPlan,
    setSecuritySummary,
    setWriterResult,
    setArchitectureResult,
    setCompilationResult,
    setRepoInfo
  } = useAgentStore((state) => ({
    setPlan: (plan) => useAgentStore.setState({ plan }),
    setSecuritySummary: (data) => useAgentStore.setState({ securitySummary: data }),
    setWriterResult: (data) => useAgentStore.setState({ writerResult: data }),
    setArchitectureResult: (data) => useAgentStore.setState({ architectureResult: data }),
    setCompilationResult: (data) => useAgentStore.setState({ compilationResult: data }),
    setRepoInfo: (data) => useAgentStore.setState({ repoInfo: data })
  }))

  useEffect(() => {
    fetchAnalysis()

    // Cleanup: reset store when leaving page
    return () => {
      useAgentStore.setState({
        plan: null,
        securitySummary: null,
        writerResult: null,
        architectureResult: null,
        compilationResult: null,
        repoInfo: null,
        pipelinePhase: 'idle'
      })
    }
  }, [id])

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      const response = await fetch(`/api/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Analysis not found')
        }
        throw new Error('Failed to fetch analysis')
      }

      const data = await response.json()
      setAnalysis(data.analysis)

      // Populate the store with saved results
      if (data.analysis?.results) {
        const { plan, bugs, documentation, refactors, summary } = data.analysis.results

        if (plan) {
          useAgentStore.setState({ plan })
        }

        // Handle V1 saved data vs V2 saved data
        if (bugs) {
          useAgentStore.setState({
            securitySummary: Array.isArray(bugs) ? { bugs, totalIssues: bugs.length } : bugs
          })
        }

        if (documentation) {
          useAgentStore.setState({ writerResult: documentation })
        }

        if (refactors) {
          useAgentStore.setState({
            architectureResult: Array.isArray(refactors) ? { refactors } : refactors
          })
        }

        if (summary) {
          useAgentStore.setState({ compilationResult: summary })
        }

        // Set repo info
        useAgentStore.setState({
          repoInfo: {
            url: data.analysis.repo_url,
            name: data.analysis.repo_name,
            files: Array(data.analysis.file_count || 0).fill({})
          },
          pipelinePhase: 'complete'
        })
      }
    } catch (err) {
      console.error('Error fetching analysis:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
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

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 flex items-center justify-center px-4">
        <Card className="bg-gray-900 border-white/10 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Bug className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Analysis</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={fetchAnalysis}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        {/* Header Card */}
        <Card className="bg-gray-900 border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Left Side - Repo Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {analysis.repo_name || 'Unknown Repository'}
                    </h1>
                    <a
                      href={analysis.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                    >
                      {analysis.repo_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Bug className="w-4 h-4 text-red-400" />
                    <span>{analysis.bug_count || 0} bugs found</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span>{analysis.file_count || 0} files analyzed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{formatDuration(analysis.duration_ms)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span>
                      {analysis.created_at
                        ? format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')
                        : 'Unknown date'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Status & Actions */}
              <div className="flex flex-col items-end gap-3">
                {getStatusBadge(analysis.status)}
                <span className="text-gray-500 text-sm">
                  {analysis.created_at
                    ? formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })
                    : ''
                  }
                </span>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-gray-300 hover:bg-white/10"
                >
                  <a
                    href={analysis.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {analysis.status === 'completed' && analysis.results ? (
          <ResultsTabs />
        ) : analysis.status === 'failed' ? (
          <Card className="bg-gray-900 border-white/10">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Bug className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Analysis Failed</h2>
              <p className="text-gray-400">
                {analysis.results?.error || 'An error occurred during analysis'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-white/10">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Results Available</h2>
              <p className="text-gray-400">
                This analysis does not have any saved results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SavedAnalysis