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
      <div className="flex items-center bg-muted/20 border-b border-border/40 h-10">
        <span className="text-muted-foreground text-sm px-4 py-2 font-medium">No files open</span>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-muted/20 border-b border-border/40 overflow-x-auto scrollbar-hide pt-1 px-1 gap-1">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => (
          <motion.div
            key={tab.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x border-transparent
              cursor-pointer whitespace-nowrap text-xs font-medium transition-all min-w-0 mb-[-1px]
              ${tab.isActive
                ? 'bg-background/80 backdrop-blur-md text-foreground border-border/40 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
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
                  className="w-2 h-2 fill-amber-500 text-amber-500 hover:fill-amber-400 hover:text-amber-400 transition-colors"
                  title="Unsaved changes - Click to save"
                />
              ) : (
                <X
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted rounded-full p-0.5 transition-all"
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