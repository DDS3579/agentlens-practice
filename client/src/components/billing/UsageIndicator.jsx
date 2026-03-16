import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Zap, AlertCircle, CheckCircle } from 'lucide-react'

export default function UsageIndicator({
  used,
  limit = 5,
  plan,
  compact,
  showUpgrade,
}) {
  const percentage = Math.min((used / limit) * 100, 100)
  const remaining = limit - used

  const getColor = () => {
    if (used < 3) return 'green'
    if (used < 5) return 'yellow'
    return 'red'
  }

  const color = getColor()

  const colorClasses = {
    green: {
      text: 'text-green-400',
      bg: 'bg-green-500',
      progress: 'bg-green-500',
    },
    yellow: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500',
      progress: 'bg-yellow-500',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500',
      progress: 'bg-red-500',
    },
  }

  const getStatusMessage = () => {
    if (used === 0) return "You're all set! Start analyzing repos."
    if (used <= 3) return `Going strong! ${remaining} analyses left.`
    if (used === 4) return '⚠️ Almost at your limit! 1 analysis remaining.'
    return '🚫 Limit reached. Upgrade for unlimited analyses.'
  }

  const getResetDays = () => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysLeft = endOfMonth.getDate() - now.getDate()
    return daysLeft
  }

  // Pro plan - compact badge only
  if (plan === 'pro') {
    return (
      <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/30">
        <Zap className="w-3 h-3 mr-1" /> Pro — Unlimited
      </Badge>
    )
  }

  // Free plan - compact mode
  if (plan === 'free' && compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${colorClasses[color].text}`}>
          {used} / {limit}
        </span>
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${colorClasses[color].progress}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        {used >= 5 && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
    )
  }

  // Free plan - full card
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Monthly Usage</span>
        <span className="text-xs text-muted-foreground/60">
          Resets in {getResetDays()} days
        </span>
      </div>

      {/* Large usage display */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-3xl font-bold ${colorClasses[color].text}`}>
          {used}
        </span>
        <span className="text-muted-foreground text-lg">/ {limit}</span>
        <span className="text-muted-foreground text-sm ml-1">analyses</span>
      </div>

      {/* Animated progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color].progress}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>

      {/* Status message */}
      <p className="text-sm text-muted-foreground mb-4">{getStatusMessage()}</p>

      {/* Upgrade CTA */}
      {showUpgrade && used >= 3 && (
        <Button
          asChild
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Link to="/billing">
            <Zap className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Link>
        </Button>
      )}
    </div>
  )
}