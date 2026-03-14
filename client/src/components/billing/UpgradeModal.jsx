import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const proFeatures = [
  'Unlimited analyses',
  'Auto-Fix Agent',
  'GitHub write-back (create PRs)',
  'Unlimited history',
  '50 files per analysis'
]

function UpgradeModal({ isOpen, onClose, featureName, description }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Upgrade to Pro
              </DialogTitle>
              <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mt-1">
                {featureName} is a Pro feature
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-gray-400 pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Everything in Pro:
          </h4>
          <ul className="space-y-2">
            {proFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium"
          >
            <Link to="/billing" onClick={onClose} className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Upgrade to Pro — $29/mo
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white hover:bg-white/5"
          >
            Maybe later
          </Button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          🚀 Hackathon demo — contact us to upgrade
        </p>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeModal
