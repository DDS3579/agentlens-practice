
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import { useAnalysisHistory } from '../hooks/useAnalysisHistory.js'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, Bug, FileCode, ExternalLink, 
  Trash2, Search, Filter, Zap,
  CheckCircle, XCircle, Loader2,
  ChevronRight, BarChart2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { AnalysisItemSkeleton } from '../components/ui/SkeletonCard.jsx'
import { FadeIn, StaggerContainer } from '../components/ui/AnimatedPage.jsx'
import CountUp from '../components/ui/CountUp.jsx'

export default function History() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)
  
  const { isPro, userProfile, getToken } = useAuth()
  const { analyses, isLoading, error, fetchHistory, deleteAnalysis } = useAnalysisHistory()
  const navigate = useNavigate()

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    if (confirmDeleteId) {
      const timeout = setTimeout(() => setConfirmDeleteId(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [confirmDeleteId])

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }
    
    clearTimeout(searchTimeoutRef.current)
    setIsSearching(true)
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`/api/history/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setSearchResults(data.analyses)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)
    
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, getToken])

  const filtered = useMemo(() => {
    return analyses
      .filter(a => statusFilter === 'all' || a.status === statusFilter)
      .filter(a => !searchQuery || 
        a.repo_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.repo_url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [analyses, searchQuery, statusFilter])

  const displayedAnalyses = searchResults ?? filtered

  const getRepoName = (analysis) => {
    if (analysis.repo_name) return analysis.repo_name
    if (analysis.repo_url) {
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
      case 'running':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
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

  const totalBugs = useMemo(() => {
    return analyses.reduce((sum, a) => sum + (a.bug_count || 0), 0)
  }, [analyses])

  const avgDuration = useMemo(() => {
    const withDuration = analyses.filter(a => a.duration_ms)
    if (withDuration.length === 0) return 0
    const total = withDuration.reduce((sum, a) => sum + a.duration_ms, 0)
    return Math.round(total / withDuration.length / 1000)
  }, [analyses])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (confirmDeleteId === id) {
      await deleteAnalysis(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  const handleCardClick = (id) => {
    navigate(`/analysis/${id}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <Card className="bg-red-500/10 border border-red-500/30">
              <CardContent className="p-6 text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-400 mb-2">Failed to load history</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <Button onClick={fetchHistory} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Retry
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
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-display font-bold text-white">Analysis History</h1>
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {analyses.length} total
              </Badge>
            </div>
          </div>

          {/* Upgrade Banner for Free Users */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">You're on the Free plan</p>
                      <p className="text-gray-400 text-sm">Showing last 3 analyses. Upgrade to Pro for unlimited history.</p>
                    </div>
                  </div>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/pricing">
                      Upgrade to Pro
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Row */}
          {analyses.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-gray-900 border border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">Total Analyses</p>
                  <p className="text-2xl font-bold text-white">
                    <CountUp end={analyses.length} />
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">Bugs Found</p>
                  <p className="text-2xl font-bold text-red-400">
                    <CountUp end={totalBugs} />
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold text-purple-400">
                    <CountUp end={avgDuration} suffix="s" />
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by repo name or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-white/10 text-white placeholder:text-gray-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-xs text-gray-500">Searching...</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {['all', 'completed', 'failed'].map((filter) => (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                  className={`capitalize ${
                    statusFilter === filter
                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                      : 'bg-gray-900 text-gray-400 border-white/10 hover:bg-gray-800'
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <AnalysisItemSkeleton />
              <AnalysisItemSkeleton />
              <AnalysisItemSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && displayedAnalyses.length === 0 && (
            <FadeIn>
              <Card className="bg-gray-900 border border-white/10">
                <CardContent className="p-12 text-center">
                  {searchQuery ? (
                    <>
                      <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No analyses match your search</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search query or filters</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                        }}
                        className="border-white/10 text-gray-300 hover:bg-gray-800"
                      >
                        Clear filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No analyses yet</h3>
                      <p className="text-gray-400 mb-4">Start analyzing repositories to see your history here</p>
                      <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link to="/dashboard">
                          Start your first analysis
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Analysis Cards */}
          {!isLoading && displayedAnalyses.length > 0 && (
            <StaggerContainer className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayedAnalyses.map((analysis, index) => (
                  <motion.div
                    key={analysis.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all cursor-pointer relative group"
                      onClick={() => handleCardClick(analysis.id)}
                    >
                      {/* Delete Button */}
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(analysis.id, e)}
                          className={`${
                            confirmDeleteId === analysis.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                          } transition-all`}
                        >
                          {confirmDeleteId === analysis.id ? (
                            'Delete?'
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Row 1: Repo name, status, time */}
                      <div className="flex items-center gap-3 mb-2 pr-20">
                        <h3 className="text-lg font-bold text-white truncate">
                          {getRepoName(analysis)}
                        </h3>
                        {getStatusBadge(analysis.status)}
                        <span className="text-gray-500 text-sm ml-auto whitespace-nowrap">
                          {analysis.created_at && formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Row 2: Repo URL */}
                      {analysis.repo_url && (
                        <p className="text-gray-500 text-sm font-mono truncate mb-4">
                          {analysis.repo_url}
                        </p>
                      )}

                      <Separator className="bg-white/10 mb-4" />

                      {/* Row 3: Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Bug className="w-4 h-4 text-red-400" />
                          <span>{analysis.bug_count || 0} bugs</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FileCode className="w-4 h-4 text-blue-400" />
                          <span>{analysis.file_count || 0} files</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span>{formatDuration(analysis.duration_ms)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-400 ml-auto group-hover:text-purple-300 transition-colors">
                          <BarChart2 className="w-4 h-4" />
                          <span>View</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </StaggerContainer>
          )}
        </FadeIn>
      </div>
    </div>
  )
}