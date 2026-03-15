// client/src/components/editor/EditorToolbar.jsx
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  X,
  GitCompare,
  Save,
  Wand2,
  WrapText,
  Copy,
  Check,
  FileCode,
  Circle,
} from 'lucide-react'
import { useState } from 'react'

export default function EditorToolbar({
  openFiles = [],
  activeFile = null,
  fileContents = {},
  originalContents = {},
  pendingEdits = new Set(),
  isFileModified = () => false,
  onTabClick = () => {},
  onTabClose = () => {},
  onToggleDiff = () => {},
  onToggleWordWrap = () => {},
  wordWrap = false,
  isDiffOpen = false,
  sessionId = null,
}) {
  const [copiedFile, setCopiedFile] = useState(false)
  const [saveAllClicked, setSaveAllClicked] = useState(false)

  // Get filename from path
  const getFilename = (path) => {
    return path?.split('/').pop() || path
  }

  // Copy current file content to clipboard
  const handleCopyFile = useCallback(async () => {
    if (activeFile && fileContents[activeFile]) {
      try {
        await navigator.clipboard.writeText(fileContents[activeFile])
        setCopiedFile(true)
        setTimeout(() => setCopiedFile(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }, [activeFile, fileContents])

  // Save all modified files
  const handleSaveAll = useCallback(() => {
    // In a real app, this would download as zip or save to backend
    // For hackathon, just show feedback
    setSaveAllClicked(true)
    setTimeout(() => setSaveAllClicked(false), 2000)
    
    // Create a simple download of modified files
    const modifiedFiles = openFiles.filter(path => 
      fileContents[path] !== originalContents[path]
    )
    
    if (modifiedFiles.length === 0) {
      return
    }

    // For now, just download the active file as an example
    if (activeFile && fileContents[activeFile]) {
      const blob = new Blob([fileContents[activeFile]], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = getFilename(activeFile)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [openFiles, fileContents, originalContents, activeFile])

  // Run fix agent on current file
  const handleRunFixAgent = useCallback(() => {
    if (!activeFile || !sessionId) return
    
    // Emit event to trigger fix agent
    window.dispatchEvent(new CustomEvent('runFixAgent', {
      detail: { file: activeFile, sessionId }
    }))
  }, [activeFile, sessionId])

  return (
    <TooltipProvider>
      <div className="h-[35px] bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
        {/* Left: File Tabs */}
        <div className="flex items-center h-full overflow-x-auto flex-1 min-w-0">
          {openFiles.map((filePath) => {
            const isActive = filePath === activeFile
            const isModified = isFileModified(filePath)
            const hasPendingEdit = pendingEdits.has(filePath)
            const filename = getFilename(filePath)

            return (
              <div
                key={filePath}
                onClick={() => onTabClick(filePath)}
                className={`
                  flex items-center gap-1.5 px-3 h-full cursor-pointer
                  border-r border-[#3c3c3c] min-w-0 max-w-[150px] group
                  ${isActive 
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-t-violet-500' 
                    : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#323232] border-t-2 border-t-transparent'
                  }
                `}
              >
                {/* Modified/Pending indicator */}
                {(isModified || hasPendingEdit) && (
                  <Circle 
                    className={`w-2 h-2 flex-shrink-0 fill-current ${
                      hasPendingEdit ? 'text-amber-400 animate-pulse' : 'text-white'
                    }`} 
                  />
                )}
                
                <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                
                <span className="truncate text-xs">
                  {filename}
                </span>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(filePath)
                  }}
                  className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 px-2 flex-shrink-0">
          {/* Toggle Diff View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDiff}
                className={`h-7 w-7 p-0 ${
                  isDiffOpen ? 'text-violet-400 bg-violet-400/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                <GitCompare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle Diff View</p>
            </TooltipContent>
          </Tooltip>

          {/* Save All */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveAll}
                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
              >
                {saveAllClicked ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Save All Modified Files</p>
            </TooltipContent>
          </Tooltip>

          {/* Run Fix Agent */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRunFixAgent}
                disabled={!activeFile || !sessionId}
                className="h-7 w-7 p-0 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Run Fix Agent on Current File</p>
            </TooltipContent>
          </Tooltip>

          {/* Toggle Word Wrap */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleWordWrap}
                className={`h-7 w-7 p-0 ${
                  wordWrap ? 'text-violet-400 bg-violet-400/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                <WrapText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle Word Wrap</p>
            </TooltipContent>
          </Tooltip>

          {/* Copy File */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyFile}
                disabled={!activeFile}
                className="h-7 w-7 p-0 text-gray-400 hover:text-white disabled:opacity-50"
              >
                {copiedFile ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Copy File Content</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}