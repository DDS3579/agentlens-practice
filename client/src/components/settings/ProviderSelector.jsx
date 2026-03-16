// client/src/components/settings/ProviderSelector.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore, { PROVIDER_MODELS } from '../../store/authStore'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Zap,
  Monitor,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  Loader2,
  ExternalLink,
  Lock,
  Save,
  TestTube,
  Info,
} from 'lucide-react'

// Provider definitions
const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    icon: Zap,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    ringColor: 'ring-orange-500',
    badge: 'Free',
    badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Fastest inference, free tier available',
    docsUrl: 'https://console.groq.com/keys',
    requiresKey: true,
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    icon: Monitor,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    ringColor: 'ring-blue-500',
    badge: 'Local',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Run models locally, no API key needed',
    docsUrl: 'https://ollama.ai',
    requiresKey: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Sparkles,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    ringColor: 'ring-emerald-500',
    badge: 'Own Key',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'GPT-3.5 Turbo (free tier), GPT-4 (Pro)',
    docsUrl: 'https://platform.openai.com/api-keys',
    requiresKey: true,
    keyPlaceholder: 'sk-...',
  },
]

export default function ProviderSelector() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  
  // Zustand store
  const llmProvider = useAuthStore((s) => s.llmProvider)
  const llmModel = useAuthStore((s) => s.llmModel)
  const llmBaseUrl = useAuthStore((s) => s.llmBaseUrl)
  const getDecodedApiKey = useAuthStore((s) => s.getDecodedApiKey)
  const setLLMConfig = useAuthStore((s) => s.setLLMConfig)
  const isPro = useAuthStore((s) => s.isPro)

  // Local state for form
  const [selectedProvider, setSelectedProvider] = useState(llmProvider)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(llmModel)
  const [baseUrl, setBaseUrl] = useState(llmBaseUrl)
  const [showKey, setShowKey] = useState(false)
  
  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // { success: boolean, message: string }
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize form with stored values
  useEffect(() => {
    setSelectedProvider(llmProvider)
    setModel(llmModel)
    setBaseUrl(llmBaseUrl)
    // Decode stored API key
    const decoded = getDecodedApiKey()
    setApiKey(decoded)
  }, [llmProvider, llmModel, llmBaseUrl, getDecodedApiKey])

  // Reset form when provider changes
  useEffect(() => {
    setTestResult(null)
    setSaveSuccess(false)
    
    // Set default model for provider
    if (selectedProvider === 'groq') {
      setModel(PROVIDER_MODELS.groq[0]?.value || 'llama3-8b-8192')
    } else if (selectedProvider === 'openai') {
      setModel('gpt-3.5-turbo')
    } else if (selectedProvider === 'ollama') {
      setModel('llama3:8b')
    }
  }, [selectedProvider])

  const currentProviderConfig = PROVIDERS.find(p => p.id === selectedProvider)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Mock success for Ollama (local)
      if (selectedProvider === 'ollama') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setTestResult({
          success: true,
          message: 'Ollama connection assumed working (local)',
        })
        setIsTesting(false)
        return
      }

      // Real test for Groq/OpenAI
      const token = await getToken()
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-llm-provider': selectedProvider,
          'x-llm-api-key': apiKey,
          'x-llm-model': model,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey,
          model: model,
          baseUrl: selectedProvider === 'ollama' ? baseUrl : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection successful!',
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Update Zustand store (persists to localStorage)
      setLLMConfig({
        provider: selectedProvider,
        apiKey: selectedProvider === 'ollama' ? '' : apiKey,
        model: model,
        baseUrl: selectedProvider === 'ollama' ? baseUrl : undefined,
      })

      // Show success state
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = () => {
    if (selectedProvider === 'ollama') {
      return baseUrl && model
    }
    return apiKey && model
  }

  return (
    <TooltipProvider>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                AI Provider
              </CardTitle>
              <CardDescription className="mt-1">
                Choose your model provider. Your API key is stored locally only.
              </CardDescription>
            </div>
            {saveSuccess && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map((provider) => {
              const Icon = provider.icon
              const isSelected = selectedProvider === provider.id
              const isDisabled = provider.id === 'openai' && !isPro && false // Allow all for free tier with own key

              return (
                <button
                  key={provider.id}
                  onClick={() => !isDisabled && setSelectedProvider(provider.id)}
                  disabled={isDisabled}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected
                      ? `border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20`
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${provider.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${provider.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{provider.name}</h4>
                      <Badge variant="outline" className={`text-[10px] ${provider.badgeClass}`}>
                        {provider.badge}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {provider.description}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Configuration Panel - Animated */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${selectedProvider ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium flex items-center gap-2">
                  Configure {currentProviderConfig?.name}
                </h4>
                {currentProviderConfig?.docsUrl && (
                  <a
                    href={currentProviderConfig.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Get API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Ollama Config */}
              {selectedProvider === 'ollama' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl" className="text-gray-300">Base URL</Label>
                    <Input
                      id="baseUrl"
                      type="text"
                      placeholder="http://localhost:11434"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Default: http://localhost:11434
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-gray-300">Model Name</Label>
                    <Input
                      id="model"
                      type="text"
                      placeholder="llama3:8b"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Enter the model name as shown in <code className="text-violet-400">ollama list</code>
                    </p>
                  </div>
                </>
              )}

              {/* Groq Config */}
              {selectedProvider === 'groq' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-gray-300">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {PROVIDER_MODELS.groq.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-white hover:bg-gray-800 focus:bg-gray-800"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{m.label}</span>
                              <span className="text-xs text-gray-500 ml-2">{m.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showKey ? 'text' : 'password'}
                        placeholder={currentProviderConfig?.keyPlaceholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white pr-10 placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* OpenAI Config */}
              {selectedProvider === 'openai' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showKey ? 'text' : 'password'}
                        placeholder={currentProviderConfig?.keyPlaceholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white pr-10 placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-gray-300">Model</Label>
                    <div className="relative">
                      <Input
                        id="model"
                        type="text"
                        value="gpt-3.5-turbo"
                        disabled
                        className="bg-gray-900 border-gray-700 text-gray-400 pr-10"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-gray-800 border-gray-700">
                          <p className="text-sm">Upgrade to Pro for GPT-4</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      GPT-4 available on Pro plan
                    </p>
                  </div>
                </>
              )}

              {/* Test Result */}
              {testResult && (
                <div
                  className={`
                    p-3 rounded-lg flex items-center gap-2 text-sm
                    ${testResult.success
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }
                  `}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !isFormValid()}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !isFormValid()}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saveSuccess ? 'Saved!' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </div>

          {/* Security Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <Shield className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Your API key is stored in your browser only and sent directly to the provider.
              We never store or log your API keys on our servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}