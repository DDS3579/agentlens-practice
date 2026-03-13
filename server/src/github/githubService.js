import { Octokit } from '@octokit/rest';

export function createOctokitClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('Warning: GITHUB_TOKEN not set. API rate limits will be lower.');
  }
  return new Octokit({
    auth: token
  });
}

export function parseRepoUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    
    if (url.hostname !== 'github.com') {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const owner = pathParts[0];
    const repo = pathParts[1];
    let branch = 'main';
    
    if (pathParts.length >= 4 && pathParts[2] === 'tree') {
      branch = pathParts.slice(3).join('/');
    }
    
    return { owner, repo, branch };
  } catch (error) {
    throw new Error('Invalid GitHub repository URL');
  }
}

export async function getRepoTree(owner, repo, branch = 'main') {
  const octokit = createOctokitClient();
  
  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: '1'
    });
    
    return data.tree;
  } catch (error) {
    if (error.status === 404 && branch === 'main') {
      try {
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: 'master',
          recursive: '1'
        });
        
        return data.tree;
      } catch (retryError) {
        if (retryError.status === 404) {
          throw new Error('Repository not found');
        }
        throw retryError;
      }
    }
    
    if (error.status === 404) {
      throw new Error('Repository not found');
    }
    
    throw error;
  }
}

export async function getFileContent(owner, repo, filePath, branch = 'main') {
  const octokit = createOctokitClient();
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch
    });
    
    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
    
    return {
      path: filePath,
      content: decodedContent,
      size: data.size
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

const languageMap = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.md': 'markdown',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.html': 'html',
  '.css': 'css'
};

function getLanguage(filePath) {
  const ext = '.' + filePath.split('.').pop();
  return languageMap[ext] || 'text';
}

function shouldSkipPath(path) {
  const skipPatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'vendor',
    '__pycache__',
    '.pytest_cache'
  ];
  
  return skipPatterns.some(pattern => path.includes(pattern));
}

function shouldSkipExtension(path) {
  const skipExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.pdf', '.zip', '.tar', '.gz', '.lock', '.sum'
  ];
  
  if (path.endsWith('.mod') && !path.endsWith('go.mod')) {
    return true;
  }
  
  return skipExtensions.some(ext => path.endsWith(ext));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchRepoFiles(owner, repo, branch = 'main', selectedPaths = []) {
  const tree = await getRepoTree(owner, repo, branch);
  
  let filesToFetch = tree.filter(item => {
    if (item.type !== 'blob') return false;
    if (item.size > 102400) return false;
    if (shouldSkipPath(item.path)) return false;
    if (shouldSkipExtension(item.path)) return false;
    
    if (selectedPaths.length > 0) {
      return selectedPaths.includes(item.path);
    }
    
    return true;
  });
  
  // Cap files to prevent token overload
  filesToFetch = filesToFetch.slice(0, 15);
  
  const results = [];
  const total = filesToFetch.length;
  
  for (let i = 0; i < filesToFetch.length; i++) {
    const file = filesToFetch[i];
    
    try {
      console.log(`Fetching ${i + 1}/${total} files...`);
      
      const fileData = await getFileContent(owner, repo, file.path, branch);
      
      results.push({
        path: fileData.path,
        content: fileData.content,
        size: fileData.size,
        language: getLanguage(fileData.path)
      });
      
      await delay(100);
    } catch (error) {
      console.error(`Failed to fetch ${file.path}:`, error.message);
      continue;
    }
  }
  
  return results;
}

export default {
  createOctokitClient,
  parseRepoUrl,
  getRepoTree,
  getFileContent,
  fetchRepoFiles
};