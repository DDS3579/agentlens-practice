import { X, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function FileTabBar({ tabs = [], onTabClick, onTabClose, onTabSave }) {
  const getFileName = (path) => {
    return path?.split('/').pop() || 'untitled'
  }

  const handleMouseDown = (e, path) => {
    // Middle click to close
    if (e.button === 1) {
      e.preventDefault()
      onTabClose?.(path)
    }
  }

  const handleDoubleClick = (path, hasChanges) => {
    if (hasChanges) {
      onTabSave?.(path)
    }
  }

  const handleIndicatorClick = (e, path, hasChanges) => {
    e.stopPropagation()
    if (hasChanges) {
      onTabSave?.(path)
    } else {
      onTabClose?.(path)
    }
  }

  if (!tabs || tabs.length === 0) {
    return (
      <div className="flex items-center bg-gray-900 border-b border-white/10 h-10">
        <span className="text-gray-600 text-sm px-4 py-2">No files open</span>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-gray-900 border-b border-white/10 overflow-x-auto scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => (
          <motion.div
            key={tab.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className={`
              group flex items-center gap-2 px-4 py-2 border-r border-white/10 
              cursor-pointer whitespace-nowrap text-sm transition-colors min-w-0
              ${tab.isActive
                ? 'bg-gray-950 text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
            onClick={() => onTabClick?.(tab.path)}
            onMouseDown={(e) => handleMouseDown(e, tab.path)}
            onDoubleClick={() => handleDoubleClick(tab.path, tab.hasChanges)}
          >
            {/* File name */}
            <span className="truncate max-w-[150px]">
              {getFileName(tab.path)}
            </span>

            {/* Indicator - Unsaved dot or close button */}
            <div
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
              onClick={(e) => handleIndicatorClick(e, tab.path, tab.hasChanges)}
            >
              {tab.hasChanges ? (
                <Circle
                  className="w-2 h-2 fill-amber-400 text-amber-400 hover:fill-amber-300 hover:text-amber-300 transition-colors"
                  title="Unsaved changes - Click to save"
                />
              ) : (
                <X
                  className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                  title="Close tab"
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default FileTabBar