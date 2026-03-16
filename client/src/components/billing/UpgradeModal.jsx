
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, Check, X, Mail, ArrowRight,
  Shield, FileText, GitBranch, Cpu
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  description,
}) {
  const [view, setView] = useState('info')
  const [copied, setCopied] = useState(false)

  const userEmail = 'user@example.com' // In real app, get from auth context
  const setIsPro = useAuthStore(state => state.setIsPro)

  const freeFeatures = [
    { icon: GitBranch, text: '5 analyses per month' },
    { icon: FileText, text: 'Basic code review' },
    { icon: Shield, text: 'Security scanning' },
  ]

  const proFeatures = [
    { icon: Zap, text: 'Unlimited analyses', highlighted: true },
    { icon: Cpu, text: 'Auto-Fix Agent', highlighted: true },
    { icon: FileText, text: 'Advanced insights' },
    { icon: Shield, text: 'Priority support' },
  ]

  const handleCopy = async () => {
    const emailAddress = 'agentlens@demo.com'
    const message = `Hi, I'd like Pro access for my account: ${userEmail}`
    
    try {
      await navigator.clipboard.writeText(`${emailAddress}\n\n${message}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setView('info')
    onClose()
  }

  const handleUpgradeClick = () => {
    // Development hack: auto upgrade
    setIsPro(true)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-lg">
        <AnimatePresence mode="wait">
          {view === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Zap className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  Unlock Pro Features
                </DialogTitle>
              </DialogHeader>

              {/* Highlighted gated feature */}
              <div className="mt-4 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-purple-300">{featureName}</span>
                  <Badge className="bg-purple-600 text-white text-xs">PRO</Badge>
                </div>
                <p className="text-sm text-gray-400">{description}</p>
              </div>

              <Separator className="my-4 bg-white/10" />

              {/* Comparison columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Free column */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">What you have</h4>
                  <div className="space-y-2">
                    {freeFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                        <Check className="w-4 h-4 text-gray-500" />
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro column */}
                <div>
                  <h4 className="text-sm font-medium text-purple-400 mb-3">What you get</h4>
                  <div className="space-y-2">
                    {proFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-sm ${
                          feature.highlighted ? 'text-purple-300' : 'text-gray-300'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${feature.highlighted ? 'text-purple-400' : 'text-purple-500'}`} />
                        <span>{feature.text}</span>
                        {feature.highlighted && (
                          <Badge className="bg-purple-600/30 text-purple-300 text-xs px-1">NEW</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4 bg-white/10" />

              {/* Pricing */}
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-white">$29</span>
                <span className="text-gray-400">/month</span>
                <p className="text-sm text-gray-500 mt-1">or contact us for demo access</p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleUpgradeClick}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro (Instant)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Mail className="w-6 h-6 text-purple-400" />
                  Request Pro Access
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-4">
                  Send us an email from your registered address
                </p>

                {/* Email display card */}
                <div
                  className="p-4 bg-gray-800 border border-white/10 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={handleCopy}
                >
                  <p className="text-sm text-gray-400 mb-1">Email us at:</p>
                  <p className="text-lg font-mono text-purple-400">agentlens@demo.com</p>
                </div>

                {/* Template message */}
                <div className="mt-4 p-4 bg-gray-800/50 border border-white/10 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Template message:</p>
                  <p className="text-sm text-gray-300 font-mono">
                    "Hi, I'd like Pro access for my account: {userEmail}"
                  </p>
                </div>

                {/* Copy button */}
                <Button
                  onClick={handleCopy}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Copy Email & Message
                    </>
                  )}
                </Button>

                {/* Back button */}
                <Button
                  onClick={() => setView('info')}
                  variant="ghost"
                  className="w-full mt-2 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Back
                </Button>

                {/* Note */}
                <div className="mt-4 p-3 bg-green-600/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 text-center">
                    🚀 Hackathon demo — Pro access granted within minutes
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
