import { DiffEditor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, GitBranch } from 'lucide-react'
import { useMemo } from 'react'

function DiffViewer({
  original = '',
  modified = '',
  filename = 'untitled',
  language = 'plaintext',
  onAccept,
  onReject,
  height = '500px'
}) {
  // Calculate diff stats
  const diffStats = useMemo(() => {
    const originalLines = original.split('\n')
    const modifiedLines = modified.split('\n')

    let added = 0
    let removed = 0

    // Simple line-by-line comparison
    const maxLength = Math.max(originalLines.length, modifiedLines.length)

    const originalSet = new Set(originalLines)
    const modifiedSet = new Set(modifiedLines)

    // Count lines in modified but not in original (added)
    modifiedLines.forEach(line => {
      if (!originalSet.has(line)) {
        added++
      }
    })

    // Count lines in original but not in modified (removed)
    originalLines.forEach(line => {
      if (!modifiedSet.has(line)) {
        removed++
      }
    })

    return { added, removed }
  }, [original, modified])

  const handleEditorDidMount = (editor, monaco) => {
    // Define custom theme matching our app
    monaco.editor.defineTheme('agentlens-diff', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0f',
        'diffEditor.insertedTextBackground': '#22c55e20',
        'diffEditor.removedTextBackground': '#ef444420',
        'diffEditor.insertedLineBackground': '#22c55e15',
        'diffEditor.removedLineBackground': '#ef444415'
      }
    })
    monaco.editor.setTheme('agentlens-diff')
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <span className="text-white font-mono text-sm">{filename}</span>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            AI Fix Preview
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept Fix
          </Button>
        </div>
      </div>

      {/* Diff Editor */}
      <div style={{ height }}>
        <DiffEditor
          height="100%"
          original={original}
          modified={modified}
          language={language}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderOverviewRuler: false,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            },
            padding: { top: 12, bottom: 12 }
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-900 border-t border-white/10 px-4 py-2 text-xs flex gap-4">
        <span className="text-gray-400">Changes:</span>
        <span className="text-green-400">
          + {diffStats.added} line{diffStats.added !== 1 ? 's' : ''} added
        </span>
        <span className="text-red-400">
          - {diffStats.removed} line{diffStats.removed !== 1 ? 's' : ''} removed
        </span>
      </div>
    </div>
  )
}

export default DiffViewer
