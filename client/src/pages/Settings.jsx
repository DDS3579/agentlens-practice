import useAuth from '../hooks/useAuth.js'
import { UserProfile } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings as SettingsIcon, Cpu, Key, Zap, Server, Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

const llmOptions = [
  {
    name: 'Ollama (Local)',
    description: 'Connect your local Ollama instance',
    icon: Server,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    pro: false
  },
  {
    name: 'Groq API Key',
    description: 'Use your own Groq key for unlimited calls',
    icon: Cpu,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    pro: false
  },
  {
    name: 'OpenAI / Anthropic',
    description: 'Use GPT-4o or Claude for higher quality',
    icon: Bot,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    pro: true
  }
]

function Settings() {
  const { userProfile, isPro } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>
        </div>

        {/* Account Section */}
        <Card className="bg-gray-900 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="clerk-profile-wrapper">
              <UserProfile
                appearance={{
                  variables: {
                    colorPrimary: '#8b5cf6',
                    colorBackground: '#0f0f1a',
                    colorText: '#ffffff',
                    colorTextSecondary: '#9ca3af',
                    colorInputBackground: '#1a1a2e',
                    colorInputText: '#ffffff',
                  },
                  elements: {
                    rootBox: {
                      width: '100%'
                    },
                    card: {
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      border: 'none'
                    },
                    navbar: {
                      backgroundColor: 'transparent',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    },
                    navbarButton: {
                      color: '#9ca3af',
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.1)'
                      }
                    },
                    navbarButtonActive: {
                      color: '#ffffff',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)'
                    },
                    pageScrollBox: {
                      padding: '0'
                    },
                    page: {
                      backgroundColor: 'transparent'
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* LLM Configuration Section */}
        <Card className="bg-gray-900 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                LLM Configuration
              </CardTitle>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Coming in next update
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {llmOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.name}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-white/5 opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${option.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{option.name}</h3>
                          {option.pro && (
                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                              Pro
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{option.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-white/10 text-gray-500 cursor-not-allowed"
                    >
                      Configure
                    </Button>
                  </div>
                )
              })}
            </div>

            <p className="text-gray-500 text-sm text-center mt-6">
              🔧 LLM configuration will be available soon
            </p>
          </CardContent>
        </Card>

        {/* Plan Section */}
        <Card className="bg-gray-900 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Your Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isPro ? 'bg-purple-500/20' : 'bg-gray-800'
                }`}>
                  <Zap className={`w-6 h-6 ${isPro ? 'text-purple-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {isPro ? 'Pro Plan' : 'Free Plan'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isPro
                      ? 'Unlimited analyses and all features'
                      : `${5 - (userProfile?.analyses_this_month || 0)} analyses remaining this month`
                    }
                  </p>
                </div>
              </div>
              {!isPro && (
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link to="/billing">
                    Upgrade to Pro
                  </Link>
                </Button>
              )}
              {isPro && (
                <Badge className="bg-purple-600 text-white">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings
