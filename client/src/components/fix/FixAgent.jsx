import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useFixStore from '../../store/fixStore.js'
import useAuthStore from '../../store/authStore.js'
import useAgentStore from '../../store/agentStore.js'
import { Zap, Play, Square, RotateCcw, Lock, Check, X, Circle, AlertTriangle, FileCode } from 'lucide-react'

function FixAgent({ onUpgradeClick, onFixSingle, onFixAll, onCancel }) {
  const [selectedBugIds, setSelectedBugIds] = useState(new Set())

  // Auth store
  const userProfile = useAuthStore((state) => state.userProfile)
  const isPro = userProfile?.plan === 'pro'

  // Agent store - get bugs
  const securitySummary = useAgentStore((state) => state.securitySummary)
  const bugs = securitySummary?.issues || securitySummary?.bugs || []

  // Fix store
  const {
    isFixing,
    currentFixBugId,
    fixProgress,
    fixedBugIds,
    failedBugIds,
    startFixing,
    stopFixing,
    markBugFixed,
    markBugFailed
  } = useFixStore()

  const handleFixAll = async () => {
    if (!isPro) {
      onUpgradeClick?.()
      return
    }

    if (bugs.length === 0) return

    startFixing(bugs.length)

    // Call the wired-in fix handler from Dashboard
    if (onFixAll) {
      onFixAll(bugs)
    }
  }

  const handleFixSelected = async () => {
    if (!isPro) {
      onUpgradeClick?.()
      return
    }

    if (selectedBugIds.size === 0) return

    const selectedBugs = bugs.filter(b => selectedBugIds.has(b.id || `bug-${bugs.indexOf(b)}`))
    startFixing(selectedBugIds.size)

    if (onFixAll) {
      onFixAll(selectedBugs)
    }
  }

  const handleFixSingle = async (bugId) => {
    if (!isPro) {
      onUpgradeClick?.()
      return
    }

    const bug = bugs.find(b => (b.id || `bug-${bugs.indexOf(b)}`) === bugId) || { id: bugId }
    startFixing(1)

    if (onFixSingle) {
      onFixSingle(bug)
    }
  }

  const handleStop = () => {
    stopFixing()
    if (onCancel) {
      onCancel()
    }
  }

  const toggleBugSelection = (bugId) => {
    setSelectedBugIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(bugId)) {
        newSet.delete(bugId)
      } else {
        newSet.add(bugId)
      }
      return newSet
    })
  }

  const getBugStatus = (bugId) => {
    if (fixedBugIds.has(bugId)) return 'fixed'
    if (failedBugIds.has(bugId)) return 'failed'
    if (currentFixBugId === bugId) return 'fixing'
    return 'pending'
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'fixed':
        return <Check className="w-4 h-4 text-green-400" />
      case 'failed':
        return <X className="w-4 h-4 text-red-400" />
      case 'fixing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-4 h-4 text-purple-400" />
          </motion.div>
        )
      default:
        return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className="bg-gray-900 border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Fix Agent
          </CardTitle>
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
            Pro Feature
          </Badge>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {bugs.length > 0
            ? `${bugs.length} bug${bugs.length !== 1 ? 's' : ''} detected. Auto-fix all?`
            : 'Analyze code to detect fixable bugs.'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleFixAll}
            disabled={isFixing || bugs.length === 0}
            className={isPro
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-purple-600/50'
            }
          >
            {!isPro && <Lock className="w-4 h-4 mr-2" />}
            <Play className="w-4 h-4 mr-2" />
            Fix All Bugs
          </Button>

          <Button
            variant="outline"
            onClick={handleFixSelected}
            disabled={isFixing || selectedBugIds.size === 0}
            className="border-white/20 text-gray-300 hover:bg-white/10"
          >
            Fix Selected ({selectedBugIds.size})
          </Button>

          {isFixing && (
            <Button
              variant="outline"
              onClick={handleStop}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Progress Section */}
        <AnimatePresence>
          {isFixing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Fixing bug {fixProgress.current} of {fixProgress.total}
                </span>
                <span className="text-purple-400">{fixProgress.percentage}%</span>
              </div>
              <Progress
                value={fixProgress.percentage}
                className="h-2 bg-gray-800 [&>div]:bg-purple-500"
              />
              {currentFixBugId && (
                <p className="text-gray-500 text-xs">
                  Currently fixing: {currentFixBugId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bug List */}
        <div className="relative">
          {bugs.length === 0 ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium">No bugs to fix!</p>
              <p className="text-gray-500 text-sm">Your code looks clean.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {bugs.map((bug, index) => {
                const bugId = bug.id || `bug-${index}`
                const status = getBugStatus(bugId)
                const isSelected = selectedBugIds.has(bugId)

                return (
                  <motion.div
                    key={bugId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                      ${isSelected
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-gray-800/50 border-white/5 hover:border-white/10'
                      }
                      ${status === 'fixed' ? 'opacity-60' : ''}
                    `}
                    onClick={() => toggleBugSelection(bugId)}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(status)}
                    </div>

                    {/* Severity Badge */}
                    <Badge className={`flex-shrink-0 text-xs ${getSeverityColor(bug.severity)}`}>
                      {bug.severity || 'Medium'}
                    </Badge>

                    {/* File & Line */}
                    <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                      <FileCode className="w-3 h-3" />
                      <span className="font-mono">
                        {bug.file || bug.filename || 'unknown'}
                        {bug.line && `:${bug.line}`}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm truncate flex-1">
                      {bug.message || bug.description || bug.title || 'Unknown issue'}
                    </p>

                    {/* Fix Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFixSingle(bugId)
                      }}
                      disabled={isFixing || status === 'fixed'}
                      className={`flex-shrink-0 ${
                        status === 'fixed'
                          ? 'text-green-400'
                          : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                      }`}
                    >
                      {status === 'fixed' ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Fixed
                        </>
                      ) : status === 'failed' ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Retry
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Fix
                        </>
                      )}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Pro Gate Overlay */}
          {!isPro && bugs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Auto-Fix requires Pro
              </h3>
              <p className="text-gray-400 text-sm text-center max-w-xs mb-4">
                Upgrade to Pro to automatically fix all detected bugs with AI
              </p>
              <Button
                onClick={onUpgradeClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </motion.div>
          )}
        </div>

        {/* Stats */}
        {bugs.length > 0 && (
          <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-400" />
              {fixedBugIds.size} fixed
            </span>
            <span className="flex items-center gap-1">
              <X className="w-3 h-3 text-red-400" />
              {failedBugIds.size} failed
            </span>
            <span className="flex items-center gap-1">
              <Circle className="w-3 h-3 text-gray-400" />
              {bugs.length - fixedBugIds.size - failedBugIds.size} pending
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FixAgent
