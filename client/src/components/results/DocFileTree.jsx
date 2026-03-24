// client/src/components/results/DocFileTree.jsx
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  FolderOpen,
  File,
  Code2,
  Palette,
  Braces,
  FileText,
  Settings2,
  Search,
  ChevronRight,
  ChevronDown,
  Files,
} from 'lucide-react';

/**
 * Format bytes to KB with 1 decimal
 * @param {number} bytes 
 * @returns {string}
 */
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 0.1) return '0.1 KB';
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} KB`;
}

/**
 * Get appropriate icon for file based on extension
 * @param {string} filename 
 * @returns {{ icon: Component, color: string }}
 */
function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'mjs':
    case 'cjs':
      return { icon: Code2, color: 'text-amber-400' };
    
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
    case 'styl':
      return { icon: Palette, color: 'text-blue-400' };
    
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return { icon: Braces, color: 'text-green-400' };
    
    case 'md':
    case 'mdx':
    case 'txt':
    case 'rst':
      return { icon: FileText, color: 'text-purple-400' };
    
    case 'env':
    case 'gitignore':
    case 'dockerignore':
    case 'eslintrc':
    case 'prettierrc':
    case 'editorconfig':
      return { icon: Settings2, color: 'text-gray-400' };
    
    default:
      return { icon: File, color: 'text-gray-400' };
  }
}

/**
 * Check if name starts with dot (config/hidden file)
 * @param {string} name 
 * @returns {boolean}
 */
function isConfigFile(name) {
  return name?.startsWith('.') || name?.toLowerCase().includes('config');
}

/**
 * Single tree node component (file or folder)
 */
function TreeNode({ 
  node, 
  depth = 0, 
  expandedFolders, 
  toggleFolder, 
  onFileClick,
  searchTerm,
  matchingPaths,
}) {
  const isFolder = node.type === 'dir' || node.type === 'directory';
  const isExpanded = expandedFolders.has(node.path);
  const hasMatchingChildren = matchingPaths.has(node.path);
  const nameMatches = node.name?.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Skip if searching and no match
  if (searchTerm && !nameMatches && !hasMatchingChildren) {
    return null;
  }
  
  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path);
    } else if (onFileClick) {
      onFileClick(node.path);
    }
  };

  const { icon: FileIcon, color: iconColor } = isFolder 
    ? { icon: isExpanded ? FolderOpen : Folder, color: 'text-yellow-400' }
    : getFileIcon(node.name);

  return (
    <div>
      {/* Node Row */}
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
          transition-colors duration-150 group
          hover:bg-white/5
          ${searchTerm && nameMatches ? 'bg-violet-500/10' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/Collapse indicator for folders */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center text-gray-500">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4" /> 
        )}

        {/* Icon */}
        {isFolder ? (
          <FileIcon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
        ) : (
          <img src="/logo.png" alt="AgentLens Logo" className="w-4 h-4 object-contain" />
        )}

        {/* Name */}
        <span 
          className={`
            flex-1 text-sm truncate
            ${isFolder ? 'text-white font-medium' : 'text-gray-300'}
            ${isConfigFile(node.name) ? 'text-gray-500' : ''}
          `}
        >
          {node.name}
          {isFolder && '/'}
        </span>

        {/* Size for files */}
        {!isFolder && node.size !== undefined && (
          <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
            {formatSize(node.size)}
          </span>
        )}

        {/* Children count for folders */}
        {isFolder && node.children && (
          <span className="text-xs text-gray-600">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children (with CSS transition) */}
      {isFolder && (
        <div
          className={`
            overflow-hidden transition-all duration-200 ease-in-out
            ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {node.children?.map((child, index) => (
            <TreeNode
              key={child.path || `${node.path}/${child.name}-${index}`}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onFileClick={onFileClick}
              searchTerm={searchTerm}
              matchingPaths={matchingPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DocFileTree Component
 * Read-only collapsible file tree for documentation tab
 * 
 * @param {Object} props
 * @param {Object} props.treeData - Tree data from repoParser
 * @param {Function} props.onFileClick - Optional callback when file is clicked
 */
export default function DocFileTree({ treeData, onFileClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(() => {
    // Expand all folders by default if < 50 files, collapse if larger
    const shouldExpandAll = (treeData?.totalFiles || 0) < 50;
    
    if (!shouldExpandAll || !treeData?.tree) {
      return new Set();
    }

    // Recursively collect all folder paths
    const allFolders = new Set();
    const collectFolders = (nodes) => {
      nodes?.forEach(node => {
        if (node.type === 'dir' || node.type === 'directory') {
          allFolders.add(node.path);
          if (node.children) {
            collectFolders(node.children);
          }
        }
      });
    };
    collectFolders(treeData.tree);
    return allFolders;
  });

  // Toggle folder expansion
  const toggleFolder = useCallback((path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all folders
  const expandAll = useCallback(() => {
    const allFolders = new Set();
    const collectFolders = (nodes) => {
      nodes?.forEach(node => {
        if (node.type === 'dir' || node.type === 'directory') {
          allFolders.add(node.path);
          if (node.children) {
            collectFolders(node.children);
          }
        }
      });
    };
    collectFolders(treeData?.tree);
    setExpandedFolders(allFolders);
  }, [treeData?.tree]);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Calculate matching paths for search (memoized for performance)
  const matchingPaths = useMemo(() => {
    if (!searchTerm || !treeData?.tree) {
      return new Set();
    }

    const matches = new Set();
    const searchLower = searchTerm.toLowerCase();

    // Recursively find all paths that match or have matching descendants
    const findMatches = (nodes, parentPath = '') => {
      let hasMatch = false;

      nodes?.forEach(node => {
        const nameMatches = node.name?.toLowerCase().includes(searchLower);
        const isFolder = node.type === 'dir' || node.type === 'directory';
        
        let childrenMatch = false;
        if (isFolder && node.children) {
          childrenMatch = findMatches(node.children, node.path);
        }

        if (nameMatches || childrenMatch) {
          matches.add(node.path);
          hasMatch = true;
          
          // If this matches, expand its folder
          if (isFolder) {
            setExpandedFolders(prev => new Set([...prev, node.path]));
          }
        }
      });

      return hasMatch;
    };

    findMatches(treeData.tree);
    return matches;
  }, [searchTerm, treeData?.tree]);

  // Summary stats
  const totalFiles = treeData?.totalFiles || 0;
  const totalSize = treeData?.totalSize || 0;
  const languages = treeData?.languages || [];

  if (!treeData || !treeData.tree) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Files className="w-4 h-4 text-violet-400" />
            Project Structure
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{totalFiles} files</span>
          <span className="text-gray-600">·</span>
          {languages.length > 0 && (
            <>
              <span>{languages.slice(0, 3).join(' · ')}</span>
              {languages.length > 3 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-gray-700 text-gray-500">
                  +{languages.length - 3}
                </Badge>
              )}
              <span className="text-gray-600">·</span>
            </>
          )}
          <span>{formatSize(totalSize)} total</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Filter files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>

        {/* File Tree */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden pr-1 -mr-1 custom-scrollbar">
          {treeData.tree.map((node, index) => (
            <TreeNode
              key={node.path || `root-${index}`}
              node={node}
              depth={0}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onFileClick={onFileClick}
              searchTerm={searchTerm}
              matchingPaths={matchingPaths}
            />
          ))}

          {/* No results message */}
          {searchTerm && matchingPaths.size === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No files matching "{searchTerm}"
            </div>
          )}
        </div>
      </CardContent>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Card>
  );
}