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

  const userProfile = useAuthStore((state) => state.userProfile)
  const isPro = userProfile?.plan === 'pro'

  const securitySummary = useAgentStore((state) => state.securitySummary)
  const bugs = securitySummary?.issues || securitySummary?.bugs || []

  const {
    isFixing,
    currentFixBugId,
    fixProgress,
    fixedBugIds,
    failedBugIds,
    startFixing,
    stopFixing,
  } = useFixStore()

  const handleFixAll = async () => {
    if (!isPro) { onUpgradeClick?.(); return }
    if (bugs.length === 0) return
    startFixing(bugs.length)
    if (onFixAll) onFixAll(bugs)
  }

  const handleFixSelected = async () => {
    if (!isPro) { onUpgradeClick?.(); return }
    if (selectedBugIds.size === 0) return
    const selectedBugs = bugs.filter(b => selectedBugIds.has(b.id || `bug-${bugs.indexOf(b)}`))
    startFixing(selectedBugIds.size)
    if (onFixAll) onFixAll(selectedBugs)
  }

  const handleFixSingle = async (bugId) => {
    if (!isPro) { onUpgradeClick?.(); return }
    const bug = bugs.find(b => (b.id || `bug-${bugs.indexOf(b)}`) === bugId) || { id: bugId }
    startFixing(1)
    if (onFixSingle) onFixSingle(bug)
  }

  const handleStop = () => {
    stopFixing()
    if (onCancel) onCancel()
  }

  const toggleBugSelection = (bugId) => {
    setSelectedBugIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(bugId)) newSet.delete(bugId)
      else newSet.add(bugId)
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
        return 'bg-red-500/15 text-red-500 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      case 'low':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/30'
      default:
        return 'bg-muted text-muted-foreground border-border/50'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'fixed':
        return <Check className="w-4 h-4 text-emerald-500" />
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />
      case 'fixing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-4 h-4 text-violet-500" />
          </motion.div>
        )
      default:
        return <Circle className="w-4 h-4 text-muted-foreground/50" />
    }
  }

  return (
    <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-lg overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/30 bg-muted/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-bold">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-4 h-4 text-violet-500" />
            </div>
            Fix Agent
          </CardTitle>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/30 text-[10px] font-bold uppercase tracking-wider">
            Pro Feature
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          {bugs.length > 0
            ? `${bugs.length} bug${bugs.length !== 1 ? 's' : ''} detected. Auto-fix all?`
            : 'Analyze code to detect fixable bugs.'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleFixAll}
            disabled={isFixing || bugs.length === 0}
            className={`h-9 font-semibold shadow-md transition-all ${isPro
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
              : 'bg-violet-600/50 text-white/70'
            }`}
          >
            {!isPro && <Lock className="w-4 h-4 mr-2" />}
            <Play className="w-4 h-4 mr-2" />
            Fix All Bugs
          </Button>

          <Button
            variant="outline"
            onClick={handleFixSelected}
            disabled={isFixing || selectedBugIds.size === 0}
            className="border-border/50 text-foreground hover:bg-muted/50 h-9"
          >
            Fix Selected ({selectedBugIds.size})
          </Button>

          {isFixing && (
            <Button
              variant="outline"
              onClick={handleStop}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 h-9"
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
              className="space-y-2 py-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  Fixing bug {fixProgress.current} of {fixProgress.total}
                </span>
                <span className="text-violet-500 font-bold">{fixProgress.percentage}%</span>
              </div>
              <Progress
                value={fixProgress.percentage}
                className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500"
              />
              {currentFixBugId && (
                <p className="text-muted-foreground/70 text-xs font-mono">
                  Currently fixing: {currentFixBugId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bug List */}
        <div className="relative">
          {bugs.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-foreground font-semibold">No bugs to fix!</p>
              <p className="text-muted-foreground text-sm mt-1">Your code looks clean.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {bugs.map((bug, index) => {
                const bugId = bug.id || `bug-${index}`
                const status = getBugStatus(bugId)
                const isSelected = selectedBugIds.has(bugId)

                return (
                  <motion.div
                    key={bugId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                      ${isSelected
                        ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20'
                        : 'bg-muted/20 border-border/30 hover:border-border/60 hover:bg-muted/40'
                      }
                      ${status === 'fixed' ? 'opacity-50' : ''}
                    `}
                    onClick={() => toggleBugSelection(bugId)}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(status)}
                    </div>

                    <Badge variant="outline" className={`flex-shrink-0 text-[10px] font-bold uppercase ${getSeverityColor(bug.severity)}`}>
                      {bug.severity || 'Medium'}
                    </Badge>

                    <div className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0">
                      <FileCode className="w-3 h-3" />
                      <span className="font-mono">
                        {bug.file || bug.filename || 'unknown'}
                        {bug.line && `:${bug.line}`}
                      </span>
                    </div>

                    <p className="text-foreground/80 text-sm truncate flex-1">
                      {bug.message || bug.description || bug.title || 'Unknown issue'}
                    </p>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFixSingle(bugId)
                      }}
                      disabled={isFixing || status === 'fixed'}
                      className={`flex-shrink-0 h-7 text-xs ${
                        status === 'fixed'
                          ? 'text-emerald-500'
                          : 'text-violet-500 hover:text-violet-400 hover:bg-violet-500/10'
                      }`}
                    >
                      {status === 'fixed' ? (
                        <><Check className="w-3.5 h-3.5 mr-1" />Fixed</>
                      ) : status === 'failed' ? (
                        <><RotateCcw className="w-3.5 h-3.5 mr-1" />Retry</>
                      ) : (
                        <><Play className="w-3.5 h-3.5 mr-1" />Fix</>
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
              className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-xl flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-foreground font-bold text-lg mb-2">
                Auto-Fix requires Pro
              </h3>
              <p className="text-muted-foreground text-sm text-center max-w-xs mb-5">
                Upgrade to Pro to automatically fix all detected bugs with AI
              </p>
              <Button
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white shadow-lg h-10 px-6 font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </motion.div>
          )}
        </div>

        {/* Stats */}
        {bugs.length > 0 && (
          <div className="flex items-center gap-5 pt-3 border-t border-border/30 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <Check className="w-3.5 h-3.5" />
              {fixedBugIds.size} fixed
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <X className="w-3.5 h-3.5" />
              {failedBugIds.size} failed
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Circle className="w-3.5 h-3.5" />
              {bugs.length - fixedBugIds.size - failedBugIds.size} pending
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FixAgent
