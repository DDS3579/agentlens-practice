import Editor from '@monaco-editor/react'
import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, RotateCcw, Lock, Copy, Check, FileCode } from 'lucide-react'
import useAuthStore from '../../store/authStore.js'

const getLanguage = (path) => {
  const ext = path?.split('.').pop()?.toLowerCase()
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    htm: 'html',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    vue: 'vue',
    svelte: 'svelte',
    graphql: 'graphql',
    gql: 'graphql',
    dockerfile: 'dockerfile',
    toml: 'toml',
    ini: 'ini',
    env: 'plaintext'
  }
  return map[ext] || 'plaintext'
}

function MonacoEditor({
  file,
  isPro = false,
  onChange,
  onSave,
  onUpgradeClick,
  initialContent,
  height = '600px',
  showToolbar = true
}) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  const content = file?.content || initialContent || ''
  const filePath = file?.path || 'untitled'
  const language = file?.language || getLanguage(filePath)

  const editorOptions = {
    readOnly: !isPro,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    padding: { top: 16, bottom: 16 },
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    folding: true,
    foldingHighlight: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  }

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Add Ctrl+S / Cmd+S save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (isPro && hasChanges) {
        handleSave()
      }
    })

    // Set the dark theme
    monaco.editor.defineTheme('agentlens-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'function', foreground: '60a5fa' }
      ],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#8b5cf640',
        'editorCursor.foreground': '#8b5cf6',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.inactiveSelectionBackground': '#8b5cf620'
      }
    })
    monaco.editor.setTheme('agentlens-dark')
  }, [isPro, hasChanges])

  const handleChange = useCallback((newValue) => {
    const originalContent = initialContent || content
    setHasChanges(newValue !== originalContent)
    onChange?.(newValue)
  }, [initialContent, content, onChange])

  const handleSave = useCallback(async () => {
    if (!editorRef.current || !hasChanges) return

    setIsSaving(true)
    try {
      await onSave?.(editorRef.current.getValue())
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, hasChanges])

  const handleReset = useCallback(() => {
    if (!editorRef.current) return

    const confirmed = window.confirm('Reset to original content? All changes will be lost.')
    if (confirmed) {
      const originalContent = initialContent || content
      editorRef.current.setValue(originalContent)
      setHasChanges(false)
      onChange?.(originalContent)
    }
  }, [initialContent, content, onChange])

  const handleCopy = useCallback(async () => {
    if (!editorRef.current) return

    try {
      await navigator.clipboard.writeText(editorRef.current.getValue())
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-white/10">
          {/* Left - File path & language */}
          <div className="flex items-center gap-3 min-w-0">
            <FileCode className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-300 text-sm font-mono truncate">
              {filePath}
            </span>
            <Badge variant="outline" className="text-gray-500 border-gray-700 text-xs flex-shrink-0">
              {language}
            </Badge>
            {hasChanges && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs flex-shrink-0">
                Unsaved
              </Badge>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {isPro ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`${
                    hasChanges
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Badge variant="outline" className="text-gray-500 border-gray-700">
                  <Lock className="w-3 h-3 mr-1" />
                  Read Only
                </Badge>
                <Button
                  size="sm"
                  onClick={onUpgradeClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Upgrade to Edit
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative" style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={content}
          options={editorOptions}
          onMount={handleEditorDidMount}
          onChange={handleChange}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />

        {/* Read-only overlay for free users */}
        {!isPro && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-950/90 border-t border-white/10 px-4 py-2 flex items-center justify-between">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              🔒 Editing requires Pro plan
            </span>
            <Button
              size="sm"
              onClick={onUpgradeClick}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonacoEditor
