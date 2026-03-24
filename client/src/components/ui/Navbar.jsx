import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import useAuthStore from '../../store/authStore.js'
import useAgentStore from '../../store/agentStore.js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, History, Settings, 
  Menu, X, ScanSearch
} from 'lucide-react'

// Safe fallback functions in case utils aren't available
const calculateOverallScore = (compilationResult, securitySummary, architectureResult) => {
  if (!compilationResult && !securitySummary && !architectureResult) return 0
  // Simple fallback calculation
  let score = 75 // Base score
  if (securitySummary?.risk_level === 'high') score -= 20
  if (securitySummary?.risk_level === 'medium') score -= 10
  if (architectureResult?.quality === 'good') score += 10
  return Math.max(0, Math.min(100, score))
}

const scoreToGrade = (score) => {
  if (score >= 90) return { grade: 'A', color: '#22c55e', label: 'Excellent' }
  if (score >= 80) return { grade: 'B', color: '#3b82f6', label: 'Good' }
  if (score >= 70) return { grade: 'C', color: '#eab308', label: 'Fair' }
  if (score >= 60) return { grade: 'D', color: '#f97316', label: 'Poor' }
  return { grade: 'F', color: '#ef4444', label: 'Critical' }
}

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const pipelineSteps = [
  { id: 'fetching', label: 'Fetch', index: 0 },
  { id: 'planning', label: 'Plan', index: 1 },
  { id: 'analyzing', label: 'Analyze', index: 2 },
  { id: 'compiling', label: 'Compile', index: 3 },
  { id: 'complete', label: 'Complete', index: 4 }
]

function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  
  // Auth store
  const userProfile = useAuthStore((state) => state.userProfile)
  
  // Agent store for pipeline status
  const {
    isAnalyzing,
    currentPhase: pipelinePhase,
    agents,
    compilationResult,
    securitySummary,
    architectureResult
  } = useAgentStore()

  const isActive = (path) => location.pathname === path

  const getStepIndex = (phase) => {
    const stepMap = {
      'idle': -1,
      'fetching': 0,
      'planning': 1,
      'analyzing': 2,
      'compiling': 3,
      'complete': 4,
      'error': -2
    }
    return stepMap[phase] ?? -1
  }

  const currentStepIndex = getStepIndex(pipelinePhase)
  const showPipeline = isAnalyzing || (pipelinePhase !== 'idle' && pipelinePhase !== 'error')

  const getActiveAgentName = () => {
    const activeAgent = Object.entries(agents || {}).find(([_, agent]) => agent?.status === 'running')
    if (activeAgent) {
      const nameMap = {
        'security': 'Security Agent',
        'writer': 'Writer Agent',
        'architecture': 'Architecture Agent'
      }
      return nameMap[activeAgent[0]] || activeAgent[0]
    }
    return null
  }

  const overallScore = calculateOverallScore(compilationResult, securitySummary, architectureResult)
  const gradeInfo = scoreToGrade(overallScore)

  const scrollToResults = () => {
    const resultsElement = document.querySelector('[data-results]')
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left - Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="AgentLens Logo" className="w-8 h-8 object-contain bg-transparent" />
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Agent
                  <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
                    Lens
                  </span>
                </h1>
                <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">Multi-Agent Code Analysis</p>
              </div>
            </Link>

            {/* Center - Pipeline Steps (when analyzing) or Nav Links */}
            {showPipeline ? (
              <div className="hidden lg:flex items-center gap-1">
                {pipelineSteps.map((step, index) => {
                  const isCompleted = currentStepIndex > step.index || (pipelinePhase === 'complete' && step.index <= 4)
                  const isActiveStep = currentStepIndex === step.index
                  const isError = pipelinePhase === 'error' && currentStepIndex === -2

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActiveStep && !isError
                              ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-950'
                              : isActiveStep && isError
                              ? 'bg-red-500 text-white'
                              : 'bg-transparent border-2 border-gray-600 text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step.index + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] mt-1 ${
                            isCompleted
                              ? 'text-green-400'
                              : isActiveStep
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isActiveStep && step.id === 'analyzing' && getActiveAgentName() && (
                          <span className="text-[9px] text-purple-400 mt-0.5">
                            {getActiveAgentName()}
                          </span>
                        )}
                      </div>
                      {index < pipelineSteps.length - 1 && (
                        <div
                          className={`w-6 h-0.5 mx-1 mt-[-16px] ${
                            currentStepIndex > step.index || pipelinePhase === 'complete'
                              ? 'bg-green-500'
                              : 'bg-gray-700'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.path)
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
                        ${active 
                          ? 'text-white' 
                          : 'text-gray-400 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Idle State - How it works */}
              {pipelinePhase === 'idle' && (
                <button
                  onClick={() => setShowHowItWorks(true)}
                  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  How it works
                </button>
              )}

              {/* Analyzing State */}
              {isAnalyzing && pipelinePhase !== 'complete' && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                  <span className="animate-pulse">⚡</span>
                  <span className="text-yellow-400 text-sm font-medium">Analyzing...</span>
                </div>
              )}

              {/* Complete State - Score Badge */}
              {pipelinePhase === 'complete' && (
                <button
                  onClick={scrollToResults}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${gradeInfo.color}20`, color: gradeInfo.color }}
                  >
                    {gradeInfo.grade}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">{gradeInfo.label}</div>
                    <div className="text-sm text-white font-medium">{overallScore}/100</div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
 viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Plan Badge */}
              {userProfile?.plan === 'pro' ? (
                <Badge className="bg-purple-600 text-white hover:bg-purple-600">
                  Pro
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  Free
                </Badge>
              )}

              {/* User Button */}
              <UserButton 
                appearance={{
                  variables: { colorPrimary: '#8b5cf6' }
                }}
                afterSignOutUrl="/"
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              {userProfile?.plan === 'pro' ? (
                <Badge className="bg-purple-600 text-white hover:bg-purple-600">
                  Pro
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  Free
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-gray-950/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${active 
                        ? 'text-white bg-purple-500/20 border-l-2 border-purple-500' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
              
              {/* How it works - Mobile */}
              {pipelinePhase === 'idle' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setShowHowItWorks(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span>❓</span>
                  How it works
                </button>
              )}

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4">
                  <UserButton 
                    appearance={{
                      variables: { colorPrimary: '#8b5cf6' }
                    }}
                    afterSignOutUrl="/"
                  />
                  <span className="text-sm text-gray-400">Account</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-gray-950 border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">How AgentLens Works</h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-white font-medium">Fetch Repository</h4>
                  <p className="text-gray-400 text-sm">Clone and extract code files from your GitHub repository</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-white font-medium">Plan Analysis</h4>
                  <p className="text-gray-400 text-sm">Coordinator agent creates an analysis strategy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-white font-medium">Multi-Agent Analysis</h4>
                  <p className="text-gray-400 text-sm">
                    🛡️ Security Specialist finds vulnerabilities<br />
                    📝 Technical Writer generates documentation<br />
                    🏗️ Architecture Reviewer suggests improvements
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-white font-medium">Compile Results</h4>
                  <p className="text-gray-400 text-sm">Coordinator synthesizes findings into a unified report</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="text-white font-medium">Complete</h4>
                  <p className="text-gray-400 text-sm">View comprehensive results with actionable insights</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar