// client/src/hooks/useEditorStream.js
import { useState, useCallback, useRef } from 'react'

/**
 * Hook that manages applying agent edits to Monaco editor
 * 
 * @param {Object} options
 * @param {React.RefObject} options.editorRef - Ref to Monaco editor instance
 * @param {React.RefObject} options.monacoRef - Ref to Monaco namespace
 * @param {string} options.sessionId - Session ID for SSE
 * @param {string} options.activeFile - Currently active file path
 * @param {Object} options.fileContents - Map of file path to content
 * @param {Function} options.setFileContents - State setter for fileContents
 * @param {Function} options.setAgentEdits - State setter for agentEdits (decorations)
 * @param {Function} options.setPendingEdits - State setter for pending edit indicators
 */
export function useEditorStream({
  editorRef,
  monacoRef,
  sessionId,
  activeFile,
  fileContents,
  setFileContents,
  setAgentEdits,
  setPendingEdits,
}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [agentStatus, setAgentStatus] = useState(null)
  const [editHistory, setEditHistory] = useState([])
  
  // Track decoration IDs for cleanup
  const decorationsRef = useRef({})

  /**
   * Apply an edit to the Monaco editor
   * 
   * @param {string} file - File path
   * @param {number} lineStart - Start line (1-indexed)
   * @param {number} lineEnd - End line (1-indexed)
   * @param {string} newContent - New content to insert
   * @param {string} editType - 'replace' | 'insert' | 'delete'
   */
  const applyEdit = useCallback((file, lineStart, lineEnd, newContent, editType) => {
    const editor = editorRef?.current
    const monaco = monacoRef?.current
    
    if (!editor || !monaco) {
      console.warn('[useEditorStream] Editor or Monaco not available')
      return
    }

    // Only apply to editor if it's the active file
    if (file !== activeFile) {
      console.log('[useEditorStream] Edit for inactive file, skipping Monaco update')
      return
    }

    setIsStreaming(true)

    try {
      const model = editor.getModel()
      if (!model) {
        console.warn('[useEditorStream] No model available')
        return
      }

      // Calculate the range
      const startLineNumber = Math.max(1, lineStart)
      const endLineNumber = Math.max(startLineNumber, lineEnd)
      
      // Get line content to determine column positions
      const startLineContent = model.getLineContent(startLineNumber) || ''
      const endLineContent = model.getLineContent(endLineNumber) || ''

      let range
      let text

      if (editType === 'replace') {
        range = new monaco.Range(
          startLineNumber,
          1,
          endLineNumber,
          endLineContent.length + 1
        )
        text = newContent
      } else if (editType === 'insert') {
        range = new monaco.Range(
          startLineNumber,
          1,
          startLineNumber,
          1
        )
        text = newContent + '\n'
      } else if (editType === 'delete') {
        range = new monaco.Range(
          startLineNumber,
          1,
          endLineNumber + 1,
          1
        )
        text = ''
      } else {
        range = new monaco.Range(
          startLineNumber,
          1,
          endLineNumber,
          endLineContent.length + 1
        )
        text = newContent
      }

      // Apply the edit
      editor.executeEdits('agent-edit', [{
        range,
        text,
        forceMoveMarkers: true,
      }])

      // Add highlight decoration
      const newLineCount = (text.match(/\n/g) || []).length + 1
      const highlightRange = new monaco.Range(
        startLineNumber,
        1,
        startLineNumber + newLineCount - 1,
        model.getLineMaxColumn(startLineNumber + newLineCount - 1)
      )

      // Create decoration
      const decorations = editor.deltaDecorations([], [{
        range: highlightRange,
        options: {
          isWholeLine: true,
          className: 'agent-edit-highlight',
          glyphMarginClassName: 'agent-edit-glyph',
        }
      }])

      // Store decoration ID
      if (!decorationsRef.current[file]) {
        decorationsRef.current[file] = []
      }
      decorationsRef.current[file].push(...decorations)

      // Fade out and remove decoration after 2 seconds
      setTimeout(() => {
        if (editor && decorations.length > 0) {
          // First, change to fade class
          editor.deltaDecorations(decorations, decorations.map(id => ({
            range: highlightRange,
            options: {
              isWholeLine: true,
              className: 'agent-edit-highlight-fade',
            }
          })))

          // Then remove completely after fade
          setTimeout(() => {
            if (editor) {
              editor.deltaDecorations(decorations, [])
            }
          }, 500)
        }
      }, 2000)

      // Add to edit history
      setEditHistory(prev => [...prev, {
        file,
        lineStart,
        lineEnd,
        newContent,
        editType,
        timestamp: Date.now(),
      }])

      // Scroll to the edit
      editor.revealLineInCenter(startLineNumber)

    } catch (error) {
      console.error('[useEditorStream] Error applying edit:', error)
    } finally {
      setIsStreaming(false)
    }
  }, [editorRef, monacoRef, activeFile])

  /**
   * Clear all decorations for a file
   */
  const clearDecorations = useCallback((file) => {
    const editor = editorRef?.current
    if (editor && decorationsRef.current[file]) {
      editor.deltaDecorations(decorationsRef.current[file], [])
      decorationsRef.current[file] = []
    }
  }, [editorRef])

  /**
   * Clear all edit history
   */
  const clearHistory = useCallback(() => {
    setEditHistory([])
  }, [])

  return {
    isStreaming,
    agentStatus,
    setAgentStatus,
    applyEdit,
    editHistory,
    clearDecorations,
    clearHistory,
  }
}

export default useEditorStream