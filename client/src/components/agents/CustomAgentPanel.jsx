// client/src/components/agents/CustomAgentPanel.jsx
import { useState, useEffect } from 'react'
import useAgentStore from '../../store/agentStore'
import useFixStore from '../../store/fixStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Wand2,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Zap,
} from 'lucide-react'

// Example prompts for quick insertion
const EXAMPLE_PROMPTS = [
  {
    label: 'Add TypeScript',
    prompt: 'Add TypeScript types to all components and functions',
  },
  {
    label: 'Error handling',
    prompt: 'Add comprehensive error handling and try-catch blocks throughout the codebase',
  },
  {
    label: 'React Query',
    prompt: 'Refactor all data fetching to use React Query with proper caching',
  },
  {
    label: 'Add JSDoc',
    prompt: 'Add JSDoc documentation comments to all exported functions and components',
  },
]

const MAX_CHARS = 500

export default function CustomAgentPanel({ 
  onSubmitPrompt, 
  isPro = false,
}) {
  // Get agent status from store
  const customAgent = useAgentStore((state) => state.agents?.custom)
  const sessionId = useAgentStore((state) => state.sessionId)
  
  // Get custom prompt from fix store
  const customPrompt = useFixStore((state) => state.customPrompt)
  const setCustomPrompt = useFixStore((state) => state.setCustomPrompt)
  const customAgentEdits = useFixStore((state) => state.customAgentEdits)
  
  // Local state
  const [promptText, setPromptText] = useState(customPrompt || '')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Sync with store
  useEffect(() => {
    if (customPrompt) {
      setPromptText(customPrompt)
    }
  }, [customPrompt])

  // Derive status
  const agentStatus = customAgent?.status || 'idle'
  const isRunning = agentStatus === 'running'
  const isComplete = agentStatus === 'complete'
  const isError = agentStatus === 'error'
  const errorMessage = customAgent?.error

  // Calculate edits summary
  const editsSummary = {
    editsCount: customAgentEdits?.length || customAgent?.result?.editsCount || 0,
    filesModified: customAgent?.result?.filesModified || [],
  }

  const handlePromptChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_CHARS) {
      setPromptText(value)
    }
  }

  const handleExampleClick = (prompt) => {
    setPromptText(prompt)
  }

  const handleSubmit = () => {
    if (!promptText.trim() || isRunning || !isPro) return
    
    // Store in fixStore
    setCustomPrompt(promptText.trim())
    setHasSubmitted(true)
    
    // Call parent handler
    if (onSubmitPrompt) {
      onSubmitPrompt(promptText.trim())
    }
  }

  const charsRemaining = MAX_CHARS - promptText.length

  return (
    <Card 
      className="bg-gray-900 border-gray-800 relative overflow-hidden"
      style={{ 
        borderTop: '3px solid',
        borderImage: 'linear-gradient(90deg, #7c3aed, #4f46e5) 1'
      }}
    >
      {/* Pro Feature Overlay for Free Users */}
      {!isPro && (
        <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-violet-400 mb-2" />
          <p className="text-white font-medium mb-1">Pro Feature</p>
          <p className="text-gray-400 text-sm text-center px-4">
            Upgrade to Pro to use Custom Agent
          </p>
          <Button 
            size="sm" 
            className="mt-3 bg-violet-600 hover:bg-violet-700"
            onClick={() => window.location.href = '/billing'}
          >
            <Zap className="w-3 h-3 mr-1" />
            Upgrade
          </Button>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-400" />
            <CardTitle className="text-white text-base">Custom Agent</CardTitle>
          </div>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">
            Pro
          </Badge>
        </div>
        <CardDescription className="text-gray-400 text-sm">
          Give the AI a specific instruction to apply across your codebase
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="e.g. Add TypeScript types to all components, Refactor to use React Query, Add error boundaries to all pages..."
            value={promptText}
            onChange={handlePromptChange}
            disabled={isRunning || !isPro}
            maxLength={MAX_CHARS}
            rows={4}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-violet-500 focus:ring-violet-500/20"
          />
          <div className="flex justify-between items-center">
            <span className={`text-xs ${charsRemaining < 50 ? 'text-amber-400' : 'text-gray-500'}`}>
              {promptText.length} / {MAX_CHARS}
            </span>
            {charsRemaining < 50 && (
              <span className="text-xs text-amber-400">
                {charsRemaining} chars remaining
              </span>
            )}
          </div>
        </div>

        {/* Example Prompts */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example.prompt)}
              disabled={isRunning || !isPro}
              className={`
                px-2 py-1 text-xs rounded-full border transition-colors
                ${promptText === example.prompt
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {example.label}
            </button>
          ))}
        </div>

        {/* Status Display */}
        {hasSubmitted && (
          <div className="space-y-2">
            {isRunning && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300">
                    CustomAgent is analyzing your codebase...
                  </span>
                </div>
                <Progress value={undefined} className="h-1" />
                {customAgent?.message && (
                  <p className="text-xs text-blue-400/70 mt-2">
                    {customAgent.message}
                  </p>
                )}
              </div>
            )}

            {isComplete && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">
                    {editsSummary.editsCount} edit{editsSummary.editsCount !== 1 ? 's' : ''} applied
                    {editsSummary.filesModified.length > 0 && (
                      <> across {editsSummary.filesModified.length} file{editsSummary.filesModified.length !== 1 ? 's' : ''}</>
                    )}
                  </span>
                </div>
                {editsSummary.filesModified.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {editsSummary.filesModified.slice(0, 3).map((file, i) => (
                      <span key={i} className="text-xs text-green-400/70 bg-green-500/10 px-1.5 py-0.5 rounded">
                        {file.split('/').pop()}
                      </span>
                    ))}
                    {editsSummary.filesModified.length > 3 && (
                      <span className="text-xs text-green-400/70">
                        +{editsSummary.filesModified.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {isError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">
                    {errorMessage || 'An error occurred'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!promptText.trim() || isRunning || !isPro}
          className={`
            w-full transition-all
            ${isRunning 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'bg-violet-600 hover:bg-violet-700'
            }
          `}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Agent working...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Apply Instruction
            </>
          )}
        </Button>

        {/* Hint text */}
        {!hasSubmitted && !isRunning && (
          <p className="text-xs text-gray-500 text-center">
            The agent will analyze your codebase and apply the instruction
          </p>
        )}
      </CardContent>
    </Card>
  )
}