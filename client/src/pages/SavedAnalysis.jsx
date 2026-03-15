
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import useAgentStore from '../store/agentStore.js'
import ResultsTabs from '../components/results/ResultsTabs.jsx'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Bug, FileCode, Clock,
  ExternalLink, Calendar, Share2,
  Download, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { PageSkeleton } from '../components/ui/SkeletonCard.jsx'
import CountUp from '../components/ui/CountUp.jsx'
import { FadeIn } from '../components/ui/AnimatedPage.jsx'

export default function SavedAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken, isPro } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        const res = await fetch(`/api/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          if (res.status === 404) {
            setError({ status: 404, message: "This analysis doesn't exist or you don't have access to it" })
          } else {
            setError({ status: res.status, message: 'Failed to load analysis' })
          }
          return
        }

        const data = await res.json()
        setAnalysis(data.analysis)
      } catch (err) {
        setError({ status: 500, message: 'An error occurred while loading the analysis' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [id, getToken])

  useEffect(() => {
    if (analysis?.results) {
      const store = useAgentStore.getState()
      store.resetSession()

      const { bugs, documentation, refactors, summary, plan } = analysis.results

      if (bugs && Array.isArray(bugs)) {
        bugs.forEach(bug => store.handleSSEEvent('agent_finding', { type: 'bug', data: bug }))
      }

      if (documentation) {
        store.handleSSEEvent('agent_finding', { type: 'documentation', data: documentation })
      }

      if (refactors && Array.isArray(refactors)) {
        refactors.forEach(r => store.handleSSEEvent('agent_finding', { type: 'refactor', data: r }))
      }

      if (summary) {
        store.handleSSEEvent('session_status', { status: 'completed', summary })
      }
    }
  }, [analysis])

  const getRepoName = () => {
    if (analysis?.repo_name) return analysis.repo_name
    if (analysis?.repo_url) {
      return analysis.repo_url.split('/').slice(-2).join('/')
    }
    return 'Unknown Repository'
  }

  const formatDuration = (ms) => {
    if (!ms) return '—'
    if (ms < 1000) return '< 1s'
    return `${Math.round(ms / 1000)}s`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {status}
          </Badge>
        )
    }
  }

  const handleShare = async () => {
    if (!isPro) {
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleDownload = () => {
    const documentation = analysis?.results?.documentation || ''
    const repoName = getRepoName().replace('/', '-')
    const blob = new Blob([documentation], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoName}-analysis.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getGitHubUrl = () => {
    return analysis?.repo_url || '#'
  }

  const getHealthScore = () => {
    return analysis?.results?.summary?.codeHealthScore || 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <PageSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <Card className="bg-gray-900 border border-white/10 max-w-lg mx-auto mt-20">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Analysis not found</h2>
                <p className="text-gray-400 mb-6">{error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/history')}
                  className="border-white/10 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/history')}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </motion.div>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <CardContent className="p-0">
              {/* Row 1: Repo name, status, GitHub link */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-display font-bold text-white">
                    {getRepoName()}
                  </h1>
                  {getStatusBadge(analysis?.status)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-white/10 text-gray-300 hover:bg-gray-800"
                >
                  <a href={getGitHubUrl()} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on GitHub
                  </a>
                </Button>
              </div>

              {/* Row 2: Repo URL */}
              {analysis?.repo_url && (
                <p className="text-gray-500 text-sm font-mono mb-4 truncate">
                  {analysis.repo_url}
                </p>
              )}

              <Separator className="bg-white/10 mb-6" />

              {/* Stats Row */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.3
                    }
                  }
                }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="bg-gray-800/50 border border-white/5">
                    <CardContent className="p-4 text-center">
                      <Bug className="w-5 h-5 text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        <CountUp end={analysis?.bug_count || 0} />
                      </p>
                      <p className="text-gray-500 text-sm">Bugs Found</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="bg-gray-800/50 border border-white/5">
                    <CardContent className="p-4 text-center">
                      <FileCode className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        <CountUp end={analysis?.file_count || 0} />
                      </p>
                      <p className="text-gray-500 text-sm">Files Analyzed</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="bg-gray-800/50 border border-white/5">
                    <CardContent className="p-4 text-center">
                      <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {formatDuration(analysis?.duration_ms)}
                      </p>
                      <p className="text-gray-500 text-sm">Duration</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="bg-gray-800/50 border border-white/5">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        <CountUp end={getHealthScore()} suffix="/10" />
                      </p>
                      <p className="text-gray-500 text-sm">Health Score</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Bottom Row: Date and Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  {analysis?.created_at && (
                    <span>
                      {format(new Date(analysis.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                      <span className="text-gray-600 ml-2">
                        ({formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })})
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="border-white/10 text-gray-300 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={!isPro}
                    className={`border-white/10 ${copied
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'text-gray-300 hover:bg-gray-800'
                      } ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isPro ? 'Sharing requires Pro' : ''}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <ResultsTabs />
        </motion.div>
      </div>
    </div>
  )
}
