import { create } from 'zustand'

const initialState = {
  // File editor state
  openFiles: {},
  activeFilePath: null,
  unsavedFiles: new Set(),

  // Fix agent state
  isFixing: false,
  currentFixBugId: null,
  fixProgress: {
    current: 0,
    total: 0,
    percentage: 0
  },
  fixedBugIds: new Set(),
  failedBugIds: new Set(),
  fixHistory: [],

  // Streaming state
  streamingContent: '',
  isStreaming: false,

  // Diff view state
  showDiff: false,
  diffData: null
}

const useFixStore = create((set, get) => ({
  ...initialState,

  // File management
  openFile: (path, content, language) => {
    set((state) => ({
      openFiles: {
        ...state.openFiles,
        [path]: {
          original: content,
          current: content,
          language: language || 'plaintext'
        }
      },
      activeFilePath: path
    }))
  },

  closeFile: (path) => {
    set((state) => {
      const newOpenFiles = { ...state.openFiles }
      delete newOpenFiles[path]

      const newUnsavedFiles = new Set(state.unsavedFiles)
      newUnsavedFiles.delete(path)

      // If closing active file, switch to another open file
      let newActiveFilePath = state.activeFilePath
      if (state.activeFilePath === path) {
        const remainingPaths = Object.keys(newOpenFiles)
        newActiveFilePath = remainingPaths.length > 0 ? remainingPaths[0] : null
      }

      return {
        openFiles: newOpenFiles,
        unsavedFiles: newUnsavedFiles,
        activeFilePath: newActiveFilePath
      }
    })
  },

  setActiveFile: (path) => {
    set({ activeFilePath: path })
  },

  updateFileContent: (path, content) => {
    set((state) => {
      const file = state.openFiles[path]
      if (!file) return state

      const newUnsavedFiles = new Set(state.unsavedFiles)
      if (content !== file.original) {
        newUnsavedFiles.add(path)
      } else {
        newUnsavedFiles.delete(path)
      }

      return {
        openFiles: {
          ...state.openFiles,
          [path]: {
            ...file,
            current: content
          }
        },
        unsavedFiles: newUnsavedFiles
      }
    })
  },

  saveFile: (path) => {
    set((state) => {
      const file = state.openFiles[path]
      if (!file) return state

      const newUnsavedFiles = new Set(state.unsavedFiles)
      newUnsavedFiles.delete(path)

      return {
        openFiles: {
          ...state.openFiles,
          [path]: {
            ...file,
            original: file.current
          }
        },
        unsavedFiles: newUnsavedFiles
      }
    })
  },

  resetFile: (path) => {
    set((state) => {
      const file = state.openFiles[path]
      if (!file) return state

      const newUnsavedFiles = new Set(state.unsavedFiles)
      newUnsavedFiles.delete(path)

      return {
        openFiles: {
          ...state.openFiles,
          [path]: {
            ...file,
            current: file.original
          }
        },
        unsavedFiles: newUnsavedFiles
      }
    })
  },

  // Fix agent
  startFixing: (totalBugs) => {
    set({
      isFixing: true,
      currentFixBugId: null,
      fixProgress: {
        current: 0,
        total: totalBugs,
        percentage: 0
      },
      fixedBugIds: new Set(),
      failedBugIds: new Set()
    })
  },

  setCurrentFix: (bugId, current) => {
    set((state) => ({
      currentFixBugId: bugId,
      fixProgress: {
        ...state.fixProgress,
        current,
        percentage: state.fixProgress.total > 0 
          ? Math.round((current / state.fixProgress.total) * 100) 
          : 0
      }
    }))
  },

  markBugFixed: (bugId) => {
    set((state) => {
      const newFixedBugIds = new Set(state.fixedBugIds)
      newFixedBugIds.add(bugId)
      return { fixedBugIds: newFixedBugIds }
    })
  },

  markBugFailed: (bugId) => {
    set((state) => {
      const newFailedBugIds = new Set(state.failedBugIds)
      newFailedBugIds.add(bugId)
      return { failedBugIds: newFailedBugIds }
    })
  },

  stopFixing: () => {
    set({
      isFixing: false,
      currentFixBugId: null
    })
  },

  // Streaming
  startStream: () => {
    set({
      streamingContent: '',
      isStreaming: true
    })
  },

  appendStream: (char) => {
    set((state) => ({
      streamingContent: state.streamingContent + char
    }))
  },

  endStream: () => {
    set({ isStreaming: false })
  },

  // Fix history (undo)
  addFixHistory: (entry) => {
    set((state) => ({
      fixHistory: [
        ...state.fixHistory,
        {
          ...entry,
          timestamp: Date.now()
        }
      ]
    }))
  },

  undoFix: (bugId) => {
    const state = get()
    const historyEntry = state.fixHistory.find((entry) => entry.bugId === bugId)

    if (!historyEntry) {
      console.warn(`No fix history found for bugId: ${bugId}`)
      return
    }

    // Restore the original content
    get().updateFileContent(historyEntry.filePath, historyEntry.before)

    // Remove from fixed bugs
    const newFixedBugIds = new Set(state.fixedBugIds)
    newFixedBugIds.delete(bugId)

    // Remove from history
    const newFixHistory = state.fixHistory.filter((entry) => entry.bugId !== bugId)

    set({
      fixedBugIds: newFixedBugIds,
      fixHistory: newFixHistory
    })
  },

  // Diff view
  showDiffView: (data) => {
    set({
      showDiff: true,
      diffData: data
    })
  },

  hideDiffView: () => {
    set({
      showDiff: false,
      diffData: null
    })
  },

  // Reset all
  resetFixStore: () => {
    set({
      ...initialState,
      unsavedFiles: new Set(),
      fixedBugIds: new Set(),
      failedBugIds: new Set()
    })
  }
}))

export default useFixStore