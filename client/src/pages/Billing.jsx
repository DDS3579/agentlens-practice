import useAuthStore from '../store/authStore.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Lock } from 'lucide-react'
import { useState } from 'react'

const freeFeatures = [
  '5 analyses per month',
  'All 4 AI agents',
  'View bugs + documentation',
  'Download markdown',
  'Community support'
]

const proFeatures = [
  'Everything in Free',
  'Unlimited analyses',
  'Auto-Fix Agent ✨',
  'GitHub PR creation',
  '50 files per analysis',
  'Unlimited history',
  'Priority support'
]

function Billing() {
  const userProfile = useAuthStore((state) => state.userProfile)
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false)

  const isPro = userProfile?.plan === 'pro'
  const analysesUsed = userProfile?.analyses_this_month || 0

  const handleUpgradeClick = () => {
    setShowUpgradeMessage(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Plan</h1>
            <p className="text-gray-400 mt-1">Manage your subscription and usage</p>
          </div>
          <Badge 
            className={isPro 
              ? 'bg-purple-600 text-white text-sm px-3 py-1' 
              : 'bg-gray-800 text-gray-300 border-gray-700 text-sm px-3 py-1'
            }
          >
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </Badge>
        </div>

        {/* Current Plan Card */}
        <Card className="bg-gray-900 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {isPro ? 'Pro' : 'Free'}
                </h3>
                {isPro ? (
                  <p className="text-green-400 flex items-center gap-1 mt-1">
                    <Check className="w-4 h-4" />
                    Unlimited analyses
                  </p>
                ) : (
                  <p className="text-gray-400 mt-1">
                    5 analyses / month used: <span className="text-white font-medium">{analysesUsed}/5</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {isPro ? '$29' : '$0'}
                  <span className="text-lg text-gray-400 font-normal">/mo</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Message */}
        {showUpgradeMessage && (
          <div className="bg-purple-950 border border-purple-500 rounded-xl p-4 text-purple-200 mb-8">
            🚀 Payment integration coming soon! For demo purposes, contact the team to get Pro access.
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <Card className="bg-gray-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                <div className="flex items-center justify-between">
                  <span>Free</span>
                  <span className="text-2xl font-bold">
                    $0<span className="text-lg text-gray-400 font-normal">/mo</span>
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-gray-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full mt-6 border-gray-700 text-gray-400 hover:bg-gray-800"
                disabled
              >
                {!isPro ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card className="bg-gray-900 border-purple-500 border-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-purple-600 text-white">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-white">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Pro
                    <Zap className="w-5 h-5 text-purple-400" />
                  </span>
                  <span className="text-2xl font-bold">
                    $29<span className="text-lg text-gray-400 font-normal">/mo</span>
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-purple-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <Button 
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-600 cursor-default"
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" />
                  You're on Pro
                </Button>
              ) : (
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                  onClick={handleUpgradeClick}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Contact */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Need help or have questions?{' '}
            <a href="mailto:support@agentlens.dev" className="text-purple-400 hover:text-purple-300 transition-colors">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Billing
