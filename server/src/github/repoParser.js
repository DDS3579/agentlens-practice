// server/src/github/repoParser.js

/**
 * Builds a nested file tree structure from flat GitHub tree items.
 * @param {Array<{path: string, type: string, sha: string, size: number}>} treeItems
 * @returns {Array} Nested tree structure
 */
export function buildFileTree(treeItems) {
  const root = [];

  for (const item of treeItems) {
    const parts = item.path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1 && item.type === 'blob';

      let existing = currentLevel.find((node) => node.name === part && node.path === currentPath);

      if (!existing) {
        if (isFile) {
          const extension = part.includes('.') ? part.substring(part.lastIndexOf('.')) : '';
          const fileNode = {
            name: part,
            path: currentPath,
            type: 'file',
            size: item.size || 0,
            extension,
          };
          currentLevel.push(fileNode);
        } else {
          const folderNode = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          currentLevel.push(folderNode);
          existing = folderNode;
        }
      }

      if (!isFile && existing) {
        currentLevel = existing.children;
      }
    }
  }

  sortTree(root);
  return root;
}

/**
 * Recursively sorts tree nodes: folders before files, then alphabetically.
 * @param {Array} nodes
 */
function sortTree(nodes) {
  nodes.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    if (node.type === 'folder' && node.children) {
      sortTree(node.children);
    }
  }
}

/**
 * Computes file count per language, ignoring 'text' and 'markdown'.
 * @param {Array<{path: string, content: string, size: number, language: string}>} files
 * @returns {Object} e.g. { javascript: 5, python: 2 }
 */
export function getLanguageStats(files) {
  const stats = {};

  for (const file of files) {
    const lang = file.language ? file.language.toLowerCase() : null;

    if (!lang || lang === 'text' || lang === 'markdown') {
      continue;
    }

    if (stats[lang]) {
      stats[lang]++;
    } else {
      stats[lang] = 1;
    }
  }

  return stats;
}

/**
 * Detects the project type based on files and tree items.
 * @param {Array<{path: string, content: string, size: number, language: string}>} files
 * @param {Array<{path: string, type: string, sha: string, size: number}>} treeItems
 * @returns {string} Project type description
 */
export function detectProjectType(files, treeItems) {
  const filePaths = treeItems.map((item) => item.path);
  const filePathsLower = filePaths.map((p) => p.toLowerCase());

  const hasPackageJson = filePathsLower.some((p) => p === 'package.json' || p.endsWith('/package.json'));
  const hasRequirementsTxt = filePathsLower.some((p) => p === 'requirements.txt' || p.endsWith('/requirements.txt'));
  const hasSetupPy = filePathsLower.some((p) => p === 'setup.py' || p.endsWith('/setup.py'));
  const hasPyprojectToml = filePathsLower.some((p) => p === 'pyproject.toml' || p.endsWith('/pyproject.toml'));
  const hasGoMod = filePathsLower.some((p) => p === 'go.mod' || p.endsWith('/go.mod'));
  const hasPomXml = filePathsLower.some((p) => p === 'pom.xml' || p.endsWith('/pom.xml'));
  const hasBuildGradle = filePathsLower.some((p) => p === 'build.gradle' || p.endsWith('/build.gradle'));
  const hasCargoToml = filePathsLower.some((p) => p === 'cargo.toml' || p.endsWith('/cargo.toml'));
  const hasCsproj = filePathsLower.some((p) => p.endsWith('.csproj'));

  // a. Has package.json + src/ folder with .jsx/.tsx files → "React Frontend"
  if (hasPackageJson) {
    const hasSrcWithReactFiles = filePaths.some((p) => {
      const lower = p.toLowerCase();
      return (
        lower.startsWith('src/') &&
        (lower.endsWith('.jsx') || lower.endsWith('.tsx'))
      );
    });

    if (hasSrcWithReactFiles) {
      return 'React Frontend';
    }
  }

  // b. Has package.json + 'express' or 'fastify' or 'koa' in any file content → "Node.js API"
  if (hasPackageJson) {
    const serverFrameworks = ['express', 'fastify', 'koa'];
    const hasServerFramework = files.some((file) => {
      if (!file.content) return false;
      const contentLower = file.content.toLowerCase();
      return serverFrameworks.some((fw) => contentLower.includes(fw));
    });

    if (hasServerFramework) {
      return 'Node.js API';
    }
  }

  // c. Has package.json (generic) → "Node.js Project"
  if (hasPackageJson) {
    return 'Node.js Project';
  }

  // d. Has requirements.txt or setup.py or pyproject.toml → "Python Project"
  if (hasRequirementsTxt || hasSetupPy || hasPyprojectToml) {
    return 'Python Project';
  }

  // e. Has go.mod → "Go Project"
  if (hasGoMod) {
    return 'Go Project';
  }

  // f. Has pom.xml or build.gradle → "Java Project"
  if (hasPomXml || hasBuildGradle) {
    return 'Java Project';
  }

  // g. Has Cargo.toml → "Rust Project"
  if (hasCargoToml) {
    return 'Rust Project';
  }

  // h. Has *.csproj → "C# Project"
  if (hasCsproj) {
    return 'C# Project';
  }

  // i. Default
  return 'Unknown Project Type';
}

/**
 * Identifies security-sensitive files based on path keywords.
 * @param {Array<{path: string, content: string, size: number, language: string}>} files
 * @returns {Array<string>} Array of security-sensitive file paths
 */
export function identifySecuritySensitiveFiles(files) {
  const sensitiveKeywords = [
    'auth',
    'login',
    'password',
    'secret',
    'token',
    'key',
    'credential',
    'session',
    'jwt',
    'oauth',
    'database',
    'db',
    'sql',
    'mongo',
    'redis',
    'env',
    'config',
    'middleware',
    'permission',
    'role',
    'admin',
  ];

  const sensitiveFiles = [];

  for (const file of files) {
    const pathLower = file.path.toLowerCase();
    const isSensitive = sensitiveKeywords.some((keyword) => pathLower.includes(keyword));

    if (isSensitive) {
      sensitiveFiles.push(file.path);
    }
  }

  return sensitiveFiles;
}

/**
 * Summarizes the repository with metadata, stats, and structure.
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {Array<{path: string, type: string, sha: string, size: number}>} treeItems
 * @param {Array<{path: string, content: string, size: number, language: string}>} files
 * @returns {Object} Repository summary
 */
export function summarizeRepo(owner, repo, branch, treeItems, files) {
  const totalFiles = treeItems.filter((item) => item.type === 'blob').length;
  const analyzedFiles = files.length;
  const projectType = detectProjectType(files, treeItems);
  const languages = getLanguageStats(files);
  const securitySensitiveFiles = identifySecuritySensitiveFiles(files);
  const fileTree = buildFileTree(treeItems);

  const totalSizeBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalSizeKB = Math.round((totalSizeBytes / 1024) * 10) / 10;

  return {
    owner,
    repo,
    branch,
    totalFiles,
    analyzedFiles,
    projectType,
    languages,
    securitySensitiveFiles,
    fileTree,
    totalSizeKB,
  };
}