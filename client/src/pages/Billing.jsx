
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import useAuthStore from '../store/authStore.js'
import PricingCard from '../components/billing/PricingCard.jsx'
import UsageIndicator from '../components/billing/UsageIndicator.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Zap, CreditCard, Calendar, CheckCircle,
  AlertCircle, ExternalLink, Mail, ArrowRight,
  Shield, Clock, FileCode, Bug
} from 'lucide-react'
import { FadeIn, StaggerContainer } from '../components/ui/AnimatedPage.jsx'
import CountUp from '../components/ui/CountUp.jsx'

const Billing = () => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)
  const { userProfile, isPro, analysesRemaining } = useAuth()

  const freeFeatures = [
    { text: '5 analyses per month', included: true },
    { text: 'All 4 AI agents', included: true },
    { text: 'Security vulnerability scanner', included: true },
    { text: 'Documentation generator', included: true },
    { text: 'Architecture review', included: true },
    { text: 'Download markdown reports', included: true },
    { text: 'Bring your own LLM', included: true },
    { text: 'Auto-Fix Agent', included: false },
    { text: 'GitHub PR creation', included: false },
    { text: 'Unlimited analyses', included: false },
    { text: 'Unlimited history', included: false },
  ]

  const proFeatures = [
    { text: 'Unlimited analyses', included: true, highlight: true },
    { text: 'Auto-Fix Agent ⚡', included: true, highlight: true },
    { text: 'GitHub PR creation', included: true, highlight: true },
    { text: 'All 4 AI agents', included: true },
    { text: 'Security vulnerability scanner', included: true },
    { text: 'Documentation generator', included: true },
    { text: 'Architecture review', included: true },
    { text: '50 files per analysis', included: true },
    { text: 'Unlimited history', included: true },
    { text: 'OpenAI / Anthropic support', included: true },
    { text: 'Priority support', included: true },
  ]

  const faqItems = [
    {
      question: 'How do I upgrade?',
      answer: 'Contact us at agentlens@demo.com',
    },
    {
      question: 'What happens when I hit the free limit?',
      answer: "You'll see an upgrade prompt. Your existing analyses are always accessible.",
    },
    {
      question: 'Can I use my own API keys?',
      answer: 'Yes! Go to Settings → LLM Config to add your own Groq, OpenAI, or Anthropic key.',
    },
  ]

  const handleManageSubscription = () => {
    alert('Subscription management coming soon!')
  }

  const handleDowngrade = () => {
    alert('Downgrade functionality coming soon!')
    setShowDowngradeConfirm(false)
  }

  return (
    <StaggerContainer className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <FadeIn>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold font-display text-white">
                  Billing & Plan
                </h1>
                <Badge className={isPro ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-600'}>
                  {isPro ? 'Pro' : 'Free'}
                </Badge>
              </div>
              <p className="text-gray-400 mt-2">
                Manage your subscription and usage
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Current Plan Summary */}
        <FadeIn delay={0.1}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left side */}
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isPro ? 'bg-purple-600/20' : 'bg-gray-800'}`}>
                  <Zap className={`w-8 h-8 ${isPro ? 'text-purple-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {isPro ? 'Pro Plan' : 'Free Plan'}
                  </h3>
                  <p className="text-gray-400">
                    {isPro ? 'Full access to all features' : 'Basic access with limited analyses'}
                  </p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-start md:items-end gap-2">
                {isPro ? (
                  <>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Unlimited analyses ✓</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Pro since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <Badge className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/20">
                      All features unlocked
                    </Badge>
                  </>
                ) : (
                  <>
                    <UsageIndicator
                      used={5 - (analysesRemaining || 0)}
                      total={5}
                      showLabel={false}
                    />
                    <p className="text-gray-400 text-sm">
                      <CountUp end={analysesRemaining || 0} /> analyses remaining this month
                    </p>
                  </>
                )}
              </div>
            </div>

            {isPro && (
              <>
                <Separator className="my-6 bg-white/10" />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    className="gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage Subscription
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </FadeIn>

        {/* Plan Comparison */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <PricingCard
              plan="free"
              price="$0"
              period="/month"
              title="Free"
              subtitle="Perfect for exploring"
              features={freeFeatures}
              ctaLabel={isPro ? "Downgrade to Free" : "Current Plan"}
              ctaDisabled={!isPro}
              isCurrentPlan={!isPro}
              onCtaClick={() => isPro && setShowDowngradeConfirm(true)}
            />
            <PricingCard
              plan="pro"
              price="$29"
              period="/month"
              title="Pro"
              subtitle="For serious developers"
              features={proFeatures}
              ctaLabel={isPro ? "Current Plan" : "Upgrade to Pro"}
              ctaDisabled={isPro}
              isCurrentPlan={isPro}
              isMostPopular={true}
              onCtaClick={() => !isPro && setShowUpgradePrompt(true)}
            />
          </div>
        </FadeIn>

        {/* Upgrade Prompt */}
        <AnimatePresence>
          {showUpgradePrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-purple-950/50 border border-purple-500 rounded-2xl p-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-16 h-16 text-purple-400 mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">
                    Upgrade to Pro
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Payment processing is coming soon!
                  </p>

                  <div className="bg-gray-900 rounded-xl p-6 w-full mb-6">
                    <div className="flex items-center justify-center gap-3 text-white">
                      <Mail className="w-6 h-6 text-purple-400" />
                      <span className="text-lg font-medium">agentlens@demo.com</span>
                    </div>
                    <p className="text-gray-400 mt-3 text-sm">
                      Send us an email with your account email to get Pro access for the demo
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradePrompt(false)}
                    className="mb-4"
                  >
                    Dismiss
                  </Button>

                  <p className="text-gray-500 text-xs">
                    🚀 This is a hackathon demo — Pro access granted manually
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Downgrade Confirm */}
        <AnimatePresence>
          {showDowngradeConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-red-950/30 border border-red-500/50 rounded-2xl p-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                  <h2 className="text-2xl font-bold font-display text-white mb-2">
                    Are you sure you want to downgrade?
                  </h2>
                  <p className="text-gray-400 mb-6">
                    You'll lose access to these features:
                  </p>

                  <ul className="text-left space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Auto-Fix Agent
                    </li>
                    <li className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Unlimited analyses (back to 5/month)
                    </li>
                    <li className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      GitHub PR creation
                    </li>
                    <li className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Priority support
                    </li>
                  </ul>

                  <div className="flex gap-4">
                    <Button
                      variant="default"
                      onClick={() => setShowDowngradeConfirm(false)}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      Keep Pro
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDowngrade}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      Downgrade
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ Section */}
        <FadeIn delay={0.3}>
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-display text-white mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-gray-900 rounded-xl p-4"
                >
                  <h3 className="text-white font-medium mb-2">{item.question}</h3>
                  <p className="text-gray-400 text-sm">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </StaggerContainer>
  )
}

export default Billing
