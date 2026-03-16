// client/src/components/editor/ProEditor.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Editor from '@monaco-editor/react'
import EditorToolbar from './EditorToolbar'
import AgentEditStream from './AgentEditStream'
import DiffViewer from './DiffViewer'
import { useEditorStream } from '../../hooks/useEditorStream'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Loader2,
  Code2,
  Braces,
  FileJson,
  Settings,
  Zap,
} from 'lucide-react'

// ============================================
// FILE TREE COMPONENT (Simplified for Pro Editor)
// ============================================
function FileTreeNode({ node, depth = 0, activeFile, onFileClick, expandedFolders, toggleFolder }) {
  const isFolder = node.type === 'dir' || node.type === 'directory' || node.children
  const isExpanded = expandedFolders.has(node.path)
  const isActive = activeFile === node.path

  // Get appropriate icon for file type
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code2 className="w-4 h-4 text-yellow-400" />
      case 'json':
        return <FileJson className="w-4 h-4 text-green-400" />
      case 'css':
      case 'scss':
      case 'sass':
        return <Braces className="w-4 h-4 text-blue-400" />
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />
      case 'env':
      case 'gitignore':
        return <Settings className="w-4 h-4 text-gray-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path)
    } else {
      onFileClick(node.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer text-sm
          transition-colors duration-100
          ${isActive ? 'bg-violet-500/20 text-white' : 'text-gray-300 hover:bg-white/5'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate ml-1">{node.name}</span>
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={child.path || `${node.path}/${child.name}-${index}`}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onFileClick={onFileClick}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// FILE TREE SIDEBAR
// ============================================
function FileTreeSidebar({ files, activeFile, onFileClick }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Build tree structure from flat file list
  const fileTree = useMemo(() => {
    if (!files || files.length === 0) return []

    const root = {}
    
    files.forEach(file => {
      const parts = file.path.split('/')
      let current = root
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? 'file' : 'dir',
            children: index === parts.length - 1 ? null : {},
            content: index === parts.length - 1 ? file.content : null,
            language: index === parts.length - 1 ? file.language : null,
          }
        }
        if (index < parts.length - 1) {
          current = current[part].children
        }
      })
    })

    // Convert to array structure
    const convertToArray = (obj) => {
      return Object.values(obj).map(node => ({
        ...node,
        children: node.children ? convertToArray(node.children) : null
      })).sort((a, b) => {
        // Folders first, then alphabetically
        if (a.type === 'dir' && b.type !== 'dir') return -1
        if (a.type !== 'dir' && b.type === 'dir') return 1
        return a.name.localeCompare(b.name)
      })
    }

    return convertToArray(root)
  }, [files])

  // Expand all folders initially
  useEffect(() => {
    const allFolderPaths = new Set()
    const collectFolders = (nodes, parentPath = '') => {
      nodes.forEach(node => {
        if (node.type === 'dir' && node.children) {
          allFolderPaths.add(node.path)
          collectFolders(node.children, node.path)
        }
      })
    }
    collectFolders(fileTree)
    setExpandedFolders(allFolderPaths)
  }, [fileTree])

  const toggleFolder = useCallback((path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  // Filter files by search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return fileTree

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const nameMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (node.children) {
          const filteredChildren = filterNodes(node.children)
          if (filteredChildren.length > 0 || nameMatches) {
            acc.push({
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : node.children
            })
          }
        } else if (nameMatches) {
          acc.push(node)
        }
        
        return acc
      }, [])
    }

    return filterNodes(fileTree)
  }, [fileTree, searchTerm])

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-r border-[#3c3c3c]">
      {/* Header */}
      <div className="p-3 border-b border-[#3c3c3c]">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Explorer
        </h3>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[#3c3c3c]">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-[#3c3c3c] text-white rounded border-none outline-none placeholder:text-gray-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredTree.length > 0 ? (
            filteredTree.map((node, index) => (
              <FileTreeNode
                key={node.path || index}
                node={node}
                activeFile={activeFile}
                onFileClick={onFileClick}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {searchTerm ? 'No files match your search' : 'No files to display'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-[#3c3c3c] text-xs text-gray-500">
        {files?.length || 0} files
      </div>
    </div>
  )
}

// ============================================
// STATUS BAR COMPONENT
// ============================================
function StatusBar({ 
  activeFile, 
  cursorPosition, 
  agentStatus, 
  isAgentEditing,
  language,
  fileSize 
}) {
  return (
    <div className="h-7 bg-[#007acc] flex items-center justify-between px-3 text-white text-xs select-none">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <GitBranch className="w-3.5 h-3.5" />
          <span>main</span>
        </div>
        
        <div className="w-px h-3 bg-white/30" />
        
        <span className="text-white/80">
          {language || 'plaintext'}
        </span>
      </div>

      {/* Center Section - Agent Status */}
      <div className="flex items-center gap-2">
        {isAgentEditing ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-white/90">
              {agentStatus?.agentName}: {agentStatus?.message || 'Processing...'}
            </span>
          </>
        ) : (
          <span className="text-white/70">Ready</span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        
        {fileSize && (
          <>
            <div className="w-px h-3 bg-white/30" />
            <span>{(fileSize / 1024).toFixed(1)} KB</span>
          </>
        )}
        
        <div className="w-px h-3 bg-white/30" />
        
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] px-1.5 py-0">
          Pro
        </Badge>
      </div>
    </div>
  )
}

// ============================================
// MAIN PRO EDITOR COMPONENT
// ============================================
export default function ProEditor({ repoFiles = [], analysisResult = null, sessionId = null }) {
  // Editor ref for Monaco instance
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // State
  const [openFiles, setOpenFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [fileContents, setFileContents] = useState({})
  const [originalContents, setOriginalContents] = useState({})
  const [agentEdits, setAgentEdits] = useState({}) // { path: [decorationIds] }
  const [pendingEdits, setPendingEdits] = useState(new Set()) // Files with unseen edits
  const [isDiffOpen, setIsDiffOpen] = useState(false)
  const [isAgentEditing, setIsAgentEditing] = useState(false)
  const [agentStatus, setAgentStatus] = useState(null)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [wordWrap, setWordWrap] = useState(false)

  // Use editor stream hook
  const { applyEdit, editHistory } = useEditorStream({
    editorRef,
    monacoRef,
    sessionId,
    activeFile,
    fileContents,
    setFileContents,
    setAgentEdits,
    setPendingEdits,
  })

  // Initialize file contents from repoFiles
  useEffect(() => {
    if (repoFiles && repoFiles.length > 0) {
      const contents = {}
      const originals = {}
      
      repoFiles.forEach(file => {
        contents[file.path] = file.content || ''
        originals[file.path] = file.content || ''
      })
      
      setFileContents(contents)
      setOriginalContents(originals)

      // Open first 3 relevant files
      const filesToOpen = getRelevantFiles(repoFiles, analysisResult)
      setOpenFiles(filesToOpen.slice(0, 3))
      if (filesToOpen.length > 0) {
        setActiveFile(filesToOpen[0])
      }
    }
  }, [repoFiles, analysisResult])

  // Get most relevant files to open initially
  const getRelevantFiles = (files, analysis) => {
    const relevantPaths = []
    
    // Add files with security issues
    if (analysis?.security?.bugs) {
      analysis.security.bugs.forEach(bug => {
        if (bug.file && !relevantPaths.includes(bug.file)) {
          relevantPaths.push(bug.file)
        }
      })
    }

    // Add entry points
    const entryPoints = ['index.js', 'index.ts', 'main.js', 'main.ts', 'App.jsx', 'App.tsx', 'app.js']
    files.forEach(file => {
      const filename = file.path.split('/').pop()
      if (entryPoints.includes(filename) && !relevantPaths.includes(file.path)) {
        relevantPaths.push(file.path)
      }
    })

    // Add README
    const readme = files.find(f => f.path.toLowerCase().includes('readme'))
    if (readme && !relevantPaths.includes(readme.path)) {
      relevantPaths.push(readme.path)
    }

    // Fill remaining with first files if needed
    files.forEach(file => {
      if (relevantPaths.length < 3 && !relevantPaths.includes(file.path)) {
        relevantPaths.push(file.path)
      }
    })

    return relevantPaths
  }

  // Handle file click from tree
  const handleFileClick = useCallback((filePath) => {
    if (!openFiles.includes(filePath)) {
      setOpenFiles(prev => [...prev, filePath])
    }
    setActiveFile(filePath)
    
    // Clear pending edit indicator for this file
    setPendingEdits(prev => {
      const next = new Set(prev)
      next.delete(filePath)
      return next
    })
  }, [openFiles])

  // Handle tab close
  const handleTabClose = useCallback((filePath) => {
    setOpenFiles(prev => {
      const next = prev.filter(p => p !== filePath)
      
      // If closing active tab, switch to adjacent
      if (activeFile === filePath && next.length > 0) {
        const closedIndex = prev.indexOf(filePath)
        const newActiveIndex = Math.min(closedIndex, next.length - 1)
        setActiveFile(next[newActiveIndex])
      } else if (next.length === 0) {
        setActiveFile(null)
      }
      
      return next
    })
  }, [activeFile])

  // Handle tab click
  const handleTabClick = useCallback((filePath) => {
    setActiveFile(filePath)
    setPendingEdits(prev => {
      const next = new Set(prev)
      next.delete(filePath)
      return next
    })
  }, [])

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Add custom styles for agent edit highlighting
    monaco.editor.defineTheme('agentlens-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    })
    monaco.editor.setTheme('agentlens-dark')

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      })
    })

    // Add CSS for agent edit highlight
    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
      .agent-edit-highlight {
        background: rgba(34, 197, 94, 0.15) !important;
        border-left: 2px solid #22c55e !important;
      }
      .agent-edit-highlight-fade {
        background: rgba(34, 197, 94, 0.08) !important;
        border-left: 2px solid rgba(34, 197, 94, 0.5) !important;
        transition: background 0.5s ease-out, border-color 0.5s ease-out;
      }
    `
    document.head.appendChild(styleSheet)
  }, [])

  // Handle editor content change (user edits)
  const handleEditorChange = useCallback((value) => {
    if (activeFile && value !== undefined) {
      setFileContents(prev => ({
        ...prev,
        [activeFile]: value
      }))
    }
  }, [activeFile])

  // Handle agent edit events
  const handleAgentEdit = useCallback((file, lineStart, lineEnd, newContent, editType) => {
    // Update file contents
    setFileContents(prev => {
      const currentContent = prev[file] || ''
      const lines = currentContent.split('\n')
      
      let updatedLines
      if (editType === 'replace') {
        updatedLines = [
          ...lines.slice(0, lineStart - 1),
          newContent,
          ...lines.slice(lineEnd)
        ]
      } else if (editType === 'insert') {
        updatedLines = [
          ...lines.slice(0, lineStart - 1),
          newContent,
          ...lines.slice(lineStart - 1)
        ]
      } else if (editType === 'delete') {
        updatedLines = [
          ...lines.slice(0, lineStart - 1),
          ...lines.slice(lineEnd)
        ]
      } else {
        updatedLines = lines
      }
      
      return {
        ...prev,
        [file]: updatedLines.join('\n')
      }
    })

    // If editing active file, apply to Monaco
    if (file === activeFile && editorRef.current && monacoRef.current) {
      applyEdit(file, lineStart, lineEnd, newContent, editType)
    } else {
      // Mark as pending edit
      setPendingEdits(prev => new Set([...prev, file]))
    }
  }, [activeFile, applyEdit])

  // Handle agent status change
  const handleAgentStatusChange = useCallback((status) => {
    setAgentStatus(status)
    setIsAgentEditing(true)
  }, [])

  // Handle agent edit complete
  const handleAgentEditComplete = useCallback(() => {
    setIsAgentEditing(false)
    setAgentStatus(null)
  }, [])

  // Get current file info
  const currentFileContent = activeFile ? fileContents[activeFile] || '' : ''
  const currentOriginalContent = activeFile ? originalContents[activeFile] || '' : ''
  const currentLanguage = useMemo(() => {
    if (!activeFile) return 'plaintext'
    const ext = activeFile.split('.').pop()?.toLowerCase()
    const langMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      css: 'css',
      scss: 'scss',
      html: 'html',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
    }
    return langMap[ext] || 'plaintext'
  }, [activeFile])

  // Check if file is modified
  const isFileModified = useCallback((filePath) => {
    return fileContents[filePath] !== originalContents[filePath]
  }, [fileContents, originalContents])

  // Empty state
  if (!repoFiles || repoFiles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Agent Edit Stream Listener */}
      {sessionId && (
        <AgentEditStream
          sessionId={sessionId}
          activeFile={activeFile}
          onEdit={handleAgentEdit}
          onEditComplete={handleAgentEditComplete}
          onAgentStatusChange={handleAgentStatusChange}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-[260px] flex-shrink-0">
          <FileTreeSidebar
            files={repoFiles}
            activeFile={activeFile}
            onFileClick={handleFileClick}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Toolbar */}
          <EditorToolbar
            openFiles={openFiles}
            activeFile={activeFile}
            fileContents={fileContents}
            originalContents={originalContents}
            pendingEdits={pendingEdits}
            isFileModified={isFileModified}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            onToggleDiff={() => setIsDiffOpen(!isDiffOpen)}
            onToggleWordWrap={() => setWordWrap(!wordWrap)}
            wordWrap={wordWrap}
            isDiffOpen={isDiffOpen}
            sessionId={sessionId}
          />

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                language={currentLanguage}
                value={currentFileContent}
                theme="vs-dark"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                  fontLigatures: true,
                  minimap: { enabled: true, scale: 0.75 },
                  scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  padding: { top: 8, bottom: 8 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
                <div className="text-center text-gray-500">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <StatusBar
            activeFile={activeFile}
            cursorPosition={cursorPosition}
            agentStatus={agentStatus}
            isAgentEditing={isAgentEditing}
            language={currentLanguage}
            fileSize={currentFileContent?.length}
          />

          {/* Diff Panel Overlay */}
          <div
            className={`
              absolute top-0 right-0 h-full w-[40%] bg-[#1e1e1e] border-l border-[#3c3c3c]
              transform transition-transform duration-200 ease-out z-10
              ${isDiffOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            {isDiffOpen && activeFile && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-[#3c3c3c] flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">
                    Changes: {activeFile.split('/').pop()}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDiffOpen(false)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DiffViewer
                    original={currentOriginalContent}
                    modified={currentFileContent}
                    filename={activeFile}
                    language={currentLanguage}
                    height="100%"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}