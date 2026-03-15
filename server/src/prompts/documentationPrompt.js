// server/src/prompts/documentationPrompt.js

/**
 * Format file size in KB with 1 decimal place
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 0.1) return '0.1 KB';
  return `${kb.toFixed(1)} KB`;
}

/**
 * Build ASCII tree representation of file structure
 * Recursively converts tree array into ASCII art
 * 
 * @param {Array} treeNodes - Array of tree nodes from repoParser
 * @param {string} prefix - Current line prefix for indentation
 * @returns {string} ASCII tree representation
 * 
 * @example Output:
 * src/
 * ├── index.js (1.2 KB)
 * ├── App.jsx (3.1 KB)
 * └── components/
 *     ├── Navbar.jsx (0.8 KB)
 *     └── Dashboard.jsx (2.4 KB)
 * package.json (0.9 KB)
 */
export function buildAsciiTree(treeNodes, prefix = '') {
  if (!treeNodes || !Array.isArray(treeNodes) || treeNodes.length === 0) {
    return '';
  }

  let result = '';

  treeNodes.forEach((node, index) => {
    const isLast = index === treeNodes.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    if (node.type === 'dir' || node.type === 'directory') {
      // Directory: add trailing slash, no size
      result += `${prefix}${connector}${node.name}/\n`;
      
      // Recursively process children
      if (node.children && node.children.length > 0) {
        result += buildAsciiTree(node.children, prefix + childPrefix);
      }
    } else {
      // File: show name and size
      const sizeStr = node.size ? ` (${formatFileSize(node.size)})` : '';
      result += `${prefix}${connector}${node.name}${sizeStr}\n`;
    }
  });

  return result;
}

/**
 * Build the documentation prompt for the Technical Writer Agent
 * 
 * @param {string} codeContext - The code content and analysis context
 * @param {Object|null} fileTreeData - Repository file tree data from repoParser
 * @param {Array} fileTreeData.tree - Array of file/folder nodes
 * @param {number} fileTreeData.totalFiles - Total number of files
 * @param {number} fileTreeData.totalSize - Total size in bytes
 * @param {Array<string>} fileTreeData.languages - Detected programming languages
 * @param {string} fileTreeData.name - Repository name
 * @returns {string} Complete prompt for the LLM
 */
export function buildDocumentationPrompt(codeContext, fileTreeData = null) {
  let fileTreeSection = '';
  let summarySection = '';

  // Build file tree section if data is provided
  if (fileTreeData && fileTreeData.tree && Array.isArray(fileTreeData.tree)) {
    const asciiTree = buildAsciiTree(fileTreeData.tree);
    
    if (asciiTree) {
      fileTreeSection = `
## Repository Structure

\`\`\`
${fileTreeData.name || 'project'}/
${asciiTree}\`\`\`

`;
    }

    // Build summary line
    const parts = [];
    if (fileTreeData.totalFiles) {
      parts.push(`${fileTreeData.totalFiles} files`);
    }
    if (fileTreeData.languages && fileTreeData.languages.length > 0) {
      parts.push(`Languages: ${fileTreeData.languages.join(', ')}`);
    }
    if (fileTreeData.totalSize) {
      parts.push(`Total size: ${formatFileSize(fileTreeData.totalSize)}`);
    }
    
    if (parts.length > 0) {
      summarySection = `\n**Project Summary:** ${parts.join(' · ')}\n`;
    }
  }

  // Build the complete prompt
  const prompt = `You are a Technical Documentation Specialist. Your task is to generate comprehensive, professional documentation for the following codebase.

${fileTreeSection}${summarySection}
## Code Analysis Context

${codeContext}

## Documentation Requirements

Generate documentation that includes:

1. **Project Overview**
   - What the project does
   - Key features and capabilities
   - Target audience/users

2. **Architecture Overview**
   - High-level system design
   - Key components and their responsibilities
   - Data flow between components

3. **Installation & Setup**
   - Prerequisites
   - Step-by-step installation instructions
   - Configuration options

4. **Usage Guide**
   - How to use the main features
   - Code examples where appropriate
   - Common use cases

5. **API Reference** (if applicable)
   - Endpoints, functions, or methods
   - Parameters and return values
   - Example requests/responses

6. **Configuration**
   - Environment variables
   - Configuration files
   - Customization options

7. **Known Issues & Security Considerations**
   - Any identified bugs or vulnerabilities
   - Security best practices
   - Limitations

8. **Contributing**
   - How to contribute
   - Code style guidelines
   - Development setup

## Output Format

- Use proper Markdown formatting
- Include code blocks with appropriate language syntax highlighting
- Use tables where appropriate
- Add emoji icons for visual appeal (sparingly)
- Make it scannable with clear headings and bullet points

Generate the documentation now:`;

  return prompt;
}

// Default export for backward compatibility
export default buildDocumentationPrompt;