
import { useState, useEffect } from 'react'
import { UserProfile } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings as SettingsIcon, Cpu, Key, Zap, 
  Check, X, Eye, EyeOff, TestTube, Save,
  AlertTriangle, ExternalLink, Lock
} from 'lucide-react'
import { FadeIn } from '../components/ui/AnimatedPage.jsx'

export default function Settings() {
  const { user, getToken, isProUser } = useAuth()
  
  const [llmConfigs, setLlmConfigs] = useState({
    ollama: { url: '', model: '', status: 'unconfigured' },
    groq: { key: '', status: 'unconfigured' },
    openai: { key: '', status: 'unconfigured' },
    anthropic: { key: '', status: 'unconfigured' }
  })
  const [showKeys, setShowKeys] = useState({})
  const [testingProvider, setTestingProvider] = useState(null)
  const [savingProvider, setSavingProvider] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState({})
  const [systemStatus, setSystemStatus] = useState(null)

  useEffect(() => {
    loadExistingKeys()
    loadSystemStatus()
  }, [])

  const loadExistingKeys = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/user/llm/keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.configs) {
          setLlmConfigs(prev => ({
            ...prev,
            ...data.configs
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load LLM keys:', error)
    }
  }

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }

  const testConnection = async (provider) => {
    setTestingProvider(provider)
    try {
      const token = await getToken()
      const config = llmConfigs[provider]
      
      const response = await fetch('/api/user/llm/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, config })
      })
      
      const data = await response.json()
      
      setLlmConfigs(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: response.ok ? 'connected' : 'error',
          error: response.ok ? null : data.error
        }
      }))
    } catch (error) {
      setLlmConfigs(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: 'error',
          error: error.message
        }
      }))
    } finally {
      setTestingProvider(null)
    }
  }

  const saveConfig = async (provider) => {
    const config = llmConfigs[provider]
    
    // Validation
    if (provider === 'ollama') {
      if (config.url && !config.url.startsWith('http')) {
        setLlmConfigs(prev => ({
          ...prev,
          [provider]: { ...prev[provider], status: 'error', error: 'URL must start with http' }
        }))
        return
      }
    } else {
      if (!config.key || config.key.trim() === '') {
        setLlmConfigs(prev => ({
          ...prev,
          [provider]: { ...prev[provider], status: 'error', error: 'API key is required' }
        }))
        return
      }
    }

    setSavingProvider(provider)
    try {
      const token = await getToken()
      
      const response = await fetch('/api/user/llm/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, config })
      })
      
      if (response.ok) {
        setSaveSuccess(prev => ({ ...prev, [provider]: true }))
        setTimeout(() => {
          setSaveSuccess(prev => ({ ...prev, [provider]: false }))
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const toggleShowKey = (provider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const updateConfig = (provider, field, value) => {
    setLlmConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
        status: 'unconfigured',
        error: null
      }
    }))
  }

  const StatusIndicator = ({ status, error }) => {
    if (status === 'connected') {
      return (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          Connected
        </div>
      )
    }
    if (status === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          {error || 'Not reachable'}
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        Not configured
      </div>
    )
  }

  const ProGate = ({ children }) => {
    if (isProUser) return children
    
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 rounded-lg">
          <Lock className="w-8 h-8 text-violet-400 mb-2" />
          <p className="text-white font-medium mb-2">Pro Feature</p>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-violet-400" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
            <Badge variant="outline" className={isProUser ? 'border-violet-500 text-violet-400' : 'border-gray-500 text-gray-400'}>
              {isProUser ? 'Pro Plan' : 'Free Plan'}
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800">
              <TabsTrigger value="account" className="data-[state=active]:bg-violet-600">
                Account
              </TabsTrigger>
              <TabsTrigger value="llm" className="data-[state=active]:bg-violet-600">
                LLM Config
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-violet-600">
                About
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Account Settings</CardTitle>
                    <CardDescription>Manage your profile and account preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          card: 'bg-transparent shadow-none',
                          navbar: 'hidden',
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* LLM Config Tab */}
            <TabsContent value="llm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ollama Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0 }}
                >
                  <Card className="bg-gray-900 border-gray-800 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-green-400" />
                          <CardTitle className="text-white">Ollama (Local)</CardTitle>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600">Free</Badge>
                      </div>
                      <CardDescription>Run models locally. No API key needed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ollama-url" className="text-gray-300">Ollama URL</Label>
                        <Input
                          id="ollama-url"
                          placeholder="http://localhost:11434"
                          value={llmConfigs.ollama.url}
                          onChange={(e) => updateConfig('ollama', 'url', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ollama-model" className="text-gray-300">Model Name</Label>
                        <Input
                          id="ollama-model"
                          placeholder="llama3:8b"
                          value={llmConfigs.ollama.model}
                          onChange={(e) => updateConfig('ollama', 'model', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <StatusIndicator status={llmConfigs.ollama.status} error={llmConfigs.ollama.error} />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection('ollama')}
                          disabled={testingProvider === 'ollama'}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          {testingProvider === 'ollama' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <TestTube className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <TestTube className="w-4 h-4 mr-1" />
                          )}
                          Test Connection
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveConfig('ollama')}
                          disabled={savingProvider === 'ollama'}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {saveSuccess.ollama ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Groq Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="bg-gray-900 border-gray-800 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-400" />
                          <CardTitle className="text-white">Groq</CardTitle>
                        </div>
                        <Badge className="bg-orange-600/20 text-orange-400 border-orange-600">Fast & Free</Badge>
                      </div>
                      <CardDescription>Use your own Groq key for unlimited calls.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="groq-key" className="text-gray-300">API Key</Label>
                        <div className="relative">
                          <Input
                            id="groq-key"
                            type={showKeys.groq ? 'text' : 'password'}
                            placeholder="gsk_..."
                            value={llmConfigs.groq.key}
                            onChange={(e) => updateConfig('groq', 'key', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey('groq')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <a
                        href="https://groq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                      >
                        Get free key at groq.com
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <StatusIndicator status={llmConfigs.groq.status} error={llmConfigs.groq.error} />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection('groq')}
                          disabled={testingProvider === 'groq'}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          {testingProvider === 'groq' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <TestTube className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <TestTube className="w-4 h-4 mr-1" />
                          )}
                          Test Key
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveConfig('groq')}
                          disabled={savingProvider === 'groq'}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {saveSuccess.groq ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* OpenAI Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="bg-gray-900 border-gray-800 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-blue-400" />
                          <CardTitle className="text-white">OpenAI</CardTitle>
                        </div>
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-600">Pro</Badge>
                      </div>
                      <CardDescription>GPT-4o for highest quality analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProGate>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="openai-key" className="text-gray-300">API Key</Label>
                            <div className="relative">
                              <Input
                                id="openai-key"
                                type={showKeys.openai ? 'text' : 'password'}
                                placeholder="sk-..."
                                value={llmConfigs.openai.key}
                                onChange={(e) => updateConfig('openai', 'key', e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowKey('openai')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <a
                            href="https://platform.openai.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                          >
                            platform.openai.com
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <StatusIndicator status={llmConfigs.openai.status} error={llmConfigs.openai.error} />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testConnection('openai')}
                              disabled={testingProvider === 'openai'}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              {testingProvider === 'openai' ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                  <TestTube className="w-4 h-4" />
                                </motion.div>
                              ) : (
                                <TestTube className="w-4 h-4 mr-1" />
                              )}
                              Test Key
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveConfig('openai')}
                              disabled={savingProvider === 'openai'}
                              className="bg-violet-600 hover:bg-violet-700"
                            >
                              {saveSuccess.openai ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </ProGate>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Anthropic Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card className="bg-gray-900 border-gray-800 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-violet-400" />
                          <CardTitle className="text-white">Anthropic Claude</CardTitle>
                        </div>
                        <Badge className="bg-violet-600/20 text-violet-400 border-violet-600">Pro</Badge>
                      </div>
                      <CardDescription>Claude for nuanced code understanding.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProGate>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="anthropic-key" className="text-gray-300">API Key</Label>
                            <div className="relative">
                              <Input
                                id="anthropic-key"
                                type={showKeys.anthropic ? 'text' : 'password'}
                                placeholder="sk-ant-..."
                                value={llmConfigs.anthropic.key}
                                onChange={(e) => updateConfig('anthropic', 'key', e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowKey('anthropic')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <a
                            href="https://console.anthropic.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                          >
                            console.anthropic.com
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <StatusIndicator status={llmConfigs.anthropic.status} error={llmConfigs.anthropic.error} />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testConnection('anthropic')}
                              disabled={testingProvider === 'anthropic'}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              {testingProvider === 'anthropic' ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                  <TestTube className="w-4 h-4" />
                                </motion.div>
                              ) : (
                                <TestTube className="w-4 h-4 mr-1" />
                              )}
                              Test Key
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveConfig('anthropic')}
                              disabled={savingProvider === 'anthropic'}
                              className="bg-violet-600 hover:bg-violet-700"
                            >
                              {saveSuccess.anthropic ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </ProGate>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">About AgentLens</CardTitle>
                    <CardDescription>AI-powered codebase analysis and visualization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">Version:</span>
                      <Badge variant="outline" className="border-violet-500 text-violet-400">v2.0.0</Badge>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="space-y-3">
                      <span className="text-gray-400">Built with:</span>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'Node.js', 'Groq', 'LangChain', 'Supabase', 'Clerk'].map((tech) => (
                          <Badge key={tech} className="bg-gray-800 text-gray-300 border-gray-700">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="space-y-3">
                      <span className="text-gray-400">Active LLM Providers:</span>
                      <div className="flex flex-wrap gap-2">
                        {systemStatus?.providers ? (
                          Object.entries(systemStatus.providers).map(([provider, available]) => (
                            <Badge
                              key={provider}
                              className={available
                                ? 'bg-green-600/20 text-green-400 border-green-600'
                                : 'bg-gray-800 text-gray-500 border-gray-700'
                              }
                            >
                              {available && <Check className="w-3 h-3 mr-1" />}
                              {provider}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">Loading...</span>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex items-center gap-4">
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-violet-400 hover:text-violet-300"
                      >
                        GitHub Repository
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Hackathon Demo</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        This application was built for a hackathon demo. Some features may be in development or have limited functionality.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </div>
  )
}
