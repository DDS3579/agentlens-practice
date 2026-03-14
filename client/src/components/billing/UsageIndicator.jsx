import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

function UsageIndicator({ used, limit, plan }) {
  if (plan === 'pro') {
    return null
  }

  const percentage = (used / limit) * 100
  const limitReached = used >= limit

  // Determine progress bar color class
  let progressColorClass = ''
  if (used < 3) {
    progressColorClass = '[&>div]:bg-green-500'
  } else if (used < 5) {
    progressColorClass = '[&>div]:bg-yellow-500'
  } else {
    progressColorClass = '[&>div]:bg-red-500'
  }

  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          <span className="text-white font-medium">{used}</span> / {limit} analyses used this month
        </span>
        {limitReached && (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
            Limit reached
          </Badge>
        )}
      </div>

      <Progress 
        value={percentage} 
        className={`h-2 bg-gray-800 ${progressColorClass}`}
      />

      <div className="mt-3">
        {limitReached ? (
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
            <Link to="/billing" className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          </Button>
        ) : (
          <Link 
            to="/billing" 
            className="text-sm text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Upgrade for unlimited
          </Link>
        )}
      </div>
    </div>
  )
}

export default UsageIndicator
