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
    <div className="rounded-xl overflow-hidden border border-border/40 shadow-xl bg-background/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/20 px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <span className="text-foreground/90 font-mono text-sm tracking-tight">{filename}</span>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/30">
            AI Fix Preview
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-8"
          >
            <X className="w-4 h-4 mr-1.5" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md h-8"
          >
            <Check className="w-4 h-4 mr-1.5" />
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
            <div className="flex items-center justify-center h-full bg-background/50 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>

      {/* Stats Bar */}
      <div className="bg-muted/10 border-t border-border/40 px-4 py-2.5 text-xs flex gap-4 font-medium tracking-wide">
        <span className="text-muted-foreground">Changes:</span>
        <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
          + {diffStats.added} line{diffStats.added !== 1 ? 's' : ''} added
        </span>
        <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
          - {diffStats.removed} line{diffStats.removed !== 1 ? 's' : ''} removed
        </span>
      </div>
    </div>
  )
}

export default DiffViewer
