import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Zap, Terminal } from 'lucide-react'
import useFixStore from '../../store/fixStore.js'

function AnimatedNumber({ value }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {value}
    </motion.span>
  )
}

function FixProgress() {
  const streamRef = useRef(null)

  const {
    fixProgress,
    currentFixBugId,
    fixedBugIds,
    failedBugIds,
    isStreaming,
    streamingContent,
    isFixing
  } = useFixStore()

  // Auto-scroll stream content
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [streamingContent])

  const progressColor = fixProgress.percentage > 80
    ? '[&>div]:bg-green-500'
    : '[&>div]:bg-purple-500'

  if (!isFixing) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900 border border-white/10 rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-5 h-5 text-purple-400" />
          </motion.div>
          <span className="text-white font-medium">Fixing bugs...</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {fixProgress.current} / {fixProgress.total}
          </span>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            {fixProgress.percentage}%
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress
        value={fixProgress.percentage}
        className={`h-2 bg-gray-800 ${progressColor}`}
      />

      {/* Currently Fixing */}
      <AnimatePresence mode="wait">
        {currentFixBugId && (
          <motion.div
            key={currentFixBugId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-gray-400 text-sm">
              Currently fixing:{' '}
              <span className="text-white font-mono">{currentFixBugId}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Stream */}
      {(isStreaming || streamingContent) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Terminal className="w-3 h-3" />
            <span>Live stream:</span>
            {isStreaming && (
              <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <div
            ref={streamRef}
            className="bg-gray-950 rounded-lg p-3 font-mono text-sm text-green-400 min-h-16 max-h-32 overflow-y-auto border border-white/10 whitespace-pre-wrap break-all"
          >
            {streamingContent || 'Waiting for fix...'}
            {isStreaming && (
              <span className="animate-pulse text-green-300">▌</span>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-6 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-gray-400 text-sm">Fixed:</span>
          <span className="text-green-400 font-medium">
            <AnimatedNumber value={fixedBugIds.size} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-gray-400 text-sm">Failed:</span>
          <span className="text-red-400 font-medium">
            <AnimatedNumber value={failedBugIds.size} />
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-gray-500 text-xs">
            {fixProgress.total - fixProgress.current} remaining
          </span>
        </div>
      </div>

      {/* Completion Message */}
      <AnimatePresence>
        {fixProgress.percentage === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 py-2 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              All fixes complete!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FixProgress
