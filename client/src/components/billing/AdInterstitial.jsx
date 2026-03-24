// client/src/components/billing/AdInterstitial.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  Check,
  Play,
  Sparkles,
  Code2,
  Shield,
  GitPullRequest,
  Cpu,
  ArrowRight,
  X,
  Timer,
} from 'lucide-react'

const AD_DURATION_SECONDS = 15

const PRO_FEATURES = [
  { icon: Zap, text: 'Unlimited analyses' },
  { icon: Sparkles, text: 'GPT-4 & Claude Opus models' },
  { icon: Code2, text: 'Built-in VS Code editor' },
  { icon: Cpu, text: 'Parallel agent execution' },
  { icon: GitPullRequest, text: 'Direct PR to GitHub' },
]

function AdInterstitial({ isOpen, onClose, onAdComplete }) {
  const navigate = useNavigate()
  const [timeRemaining, setTimeRemaining] = useState(AD_DURATION_SECONDS)
  const [adStarted, setAdStarted] = useState(false)
  const [adComplete, setAdComplete] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(AD_DURATION_SECONDS)
      setAdStarted(false)
      setAdComplete(false)
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !adStarted || adComplete) return

    if (timeRemaining <= 0) {
      setAdComplete(true)
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setAdComplete(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, adStarted, adComplete, timeRemaining])

  const handleStartAd = useCallback(() => {
    setAdStarted(true)
  }, [])

  const handleUnlockAnalysis = useCallback(() => {
    onAdComplete()
  }, [onAdComplete])

  const handleUpgrade = useCallback(() => {
    onClose()
    navigate('/billing')
  }, [onClose, navigate])

  const handleDismiss = useCallback(() => {
    onClose()
  }, [onClose])

  const progressPercent = ((AD_DURATION_SECONDS - timeRemaining) / AD_DURATION_SECONDS) * 100

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl w-[95vw] p-0 gap-0 bg-gray-950 border-white/10 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-gradient-to-r from-gray-900 to-gray-950">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                You've used all 5 free analyses
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2 text-base">
                Watch a short ad to unlock 1 more — or upgrade to Pro for unlimited access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-0 divide-x divide-white/10">
          {/* Left Column - Ad Panel */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400" />
                Watch Ad
              </h3>
              <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
                +1 Free Analysis
              </Badge>
            </div>

            {/* Fake Ad Container */}
            <div className="relative flex-1 min-h-[280px] rounded-xl border-2 border-dashed border-white/20 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950/30 overflow-hidden">
              {/* Sponsor Badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-gray-800/90 text-gray-300 border-gray-700 text-[10px] uppercase tracking-wider">
                  Sponsor
                </Badge>
              </div>

              {/* Ad Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {!adStarted ? (
                  // Pre-start state
                  <div className="text-center">
                    <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <img src="/logo.png" alt="AgentLens Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      DevTools Pro
                    </h4>
                    <p className="text-gray-400 text-sm mb-6 max-w-[200px]">
                      Ship faster with AI-powered development tools
                    </p>
                    <Button
                      onClick={handleStartAd}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Watch Ad ({AD_DURATION_SECONDS}s)
                    </Button>
                  </div>
                ) : (
                  // Ad playing state
                  <div className="text-center w-full">
                    {/* Fake product showcase */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
                        <img src="/logo.png" alt="AgentLens Logo" className="w-20 h-20 object-contain animate-pulse" />
                      </div>
                      {/* Floating elements for visual interest */}
                      <div className="absolute -top-2 -right-8 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center animate-bounce">
                        <img src="/logo.png" alt="AgentLens Logo" className="w-4 h-4 object-contain" />
                      </div>
                      <div className="absolute -bottom-2 -left-8 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center animate-bounce delay-150">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>

                    <h4 className="text-2xl font-bold text-white mb-2">
                      DevTools Pro
                    </h4>
                    <p className="text-purple-300 text-lg font-medium mb-2">
                      Ship 10x Faster with AI
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Trusted by 50,000+ developers worldwide
                    </p>

                    {/* Fake CTA button (does nothing) */}
                    <Button
                      variant="outline"
                      className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 pointer-events-none"
                    >
                      Try Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress bar at bottom - only show when ad is playing */}
              {adStarted && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950/90 to-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Timer className="w-4 h-4" />
                      {adComplete ? (
                        <span className="text-green-400">Ad complete!</span>
                      ) : (
                        <span>{timeRemaining}s remaining</span>
                      )}
                    </div>
                    {adComplete && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <img src="/logo.png" alt="AgentLens Logo" className="w-3 h-3 mr-1 object-contain" />
                        Ready
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={progressPercent}
                    className="h-2 bg-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Unlock Button */}
            <Button
              onClick={handleUnlockAnalysis}
              disabled={!adComplete}
              className={`
                w-full mt-4 h-12 text-base font-semibold transition-all duration-300
                ${adComplete
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {adComplete ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Unlock 1 Analysis
                </>
              ) : adStarted ? (
                <>
                  <Timer className="w-5 h-5 mr-2 animate-pulse" />
                  Please wait {timeRemaining}s...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start watching to unlock
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Upgrade Panel */}
          <div className="p-6 bg-gradient-to-br from-purple-950/20 to-gray-950 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Go Pro
              </h3>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Recommended
              </Badge>
            </div>

            {/* Pro Card */}
            <div className="flex-1 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-gray-900/50 p-5 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src="/logo.png" alt="AgentLens Logo" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">AgentLens Pro</h4>
                    <p className="text-purple-300 text-sm">Unlimited everything</p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {PRO_FEATURES.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Price hint */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-white">$19</span>
                  <span className="text-gray-400">/month</span>
                  <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs ml-2">
                    Save 40%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button
              onClick={handleUpgrade}
              className="w-full mt-4 h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
            >
              Upgrade to Pro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Footer - Dismiss option */}
        <div className="p-4 border-t border-white/10 bg-gray-950/80 flex justify-center">
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            No thanks, I'll wait
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdInterstitial