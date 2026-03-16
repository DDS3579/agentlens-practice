// server/src/routes/githubRoute.js

import express from 'express';
import {
  parseRepoUrl,
  getRepoTree,
  fetchRepoFiles,
  createOctokitClient,
} from '../github/githubService.js';
import { buildFileTree, summarizeRepo } from '../github/repoParser.js';

const router = express.Router();

// GET /api/github/tree
// Fetches and returns the file tree for a GitHub repository
router.get('/tree', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'GitHub repo URL is required' });
    }

    const { owner, repo, branch } = parseRepoUrl(url);
    const treeItems = await getRepoTree(owner, repo, branch);
    const nestedTree = buildFileTree(treeItems);
    const totalFiles = treeItems.filter((i) => i.type === 'blob').length;

    return res.status(200).json({
      success: true,
      owner,
      repo,
      branch,
      fileTree: nestedTree,
      totalFiles,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/github/fetch
// Fetches file contents and generates a repository summary
router.post('/fetch', async (req, res) => {
  try {
    const { url, selectedPaths } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'GitHub repo URL is required' });
    }

    const { owner, repo, branch } = parseRepoUrl(url);
    const treeItems = await getRepoTree(owner, repo, branch);
    const fetchedFiles = await fetchRepoFiles(owner, repo, branch, selectedPaths);
    const repoSummary = summarizeRepo(owner, repo, branch, treeItems, fetchedFiles);

    return res.status(200).json({
      success: true,
      summary: repoSummary,
      files: fetchedFiles,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/github/validate
// Validates that a GitHub repo URL is correct and the repository is accessible
router.get('/validate', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.json({ valid: false, error: 'GitHub repo URL is required' });
    }

    const { owner, repo, branch } = parseRepoUrl(url);
    const octokit = createOctokitClient();

    await octokit.rest.repos.get({ owner, repo });

    return res.json({
      valid: true,
      owner,
      repo,
      branch,
    });
  } catch (err) {
    return res.json({
      valid: false,
      error: err.message,
    });
  }
});

// server/src/routes/githubRoute.js
// ====================================
// ADD this endpoint to your existing router
// ====================================

// POST /api/github/pr — Create a Pull Request from agent edits
router.post('/pr', async (req, res) => {
  try {
    const { repoUrl, branch, edits, prTitle, prBody } = req.body;
    const githubToken = req.headers['x-github-token'];

    // ── Validate inputs ──
    if (!githubToken) {
      return res.status(401).json({ error: 'GitHub token is required' });
    }

    if (!repoUrl || !edits || !Array.isArray(edits) || edits.length === 0) {
      return res.status(400).json({
        error: 'repoUrl and non-empty edits array are required',
      });
    }

    // ── Extract owner/repo from URL ──
    // Supports: https://github.com/owner/repo, https://github.com/owner/repo.git
    const urlMatch = repoUrl.match(
      /github\.com\/([^/]+)\/([^/.]+)/
    );
    if (!urlMatch) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    const owner = urlMatch[1];
    const repo = urlMatch[2];

    const apiBase = 'https://api.github.com';
    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AgentLens-App',
    };

    // Helper for GitHub API calls
    async function ghFetch(url, options = {}) {
      const response = await fetch(`${apiBase}${url}`, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `GitHub API error: ${response.status}`);
        error.status = response.status;
        error.ghData = data;
        throw error;
      }

      return data;
    }

    // ── Step 1: Get default branch SHA ──
    console.log(`[GitHub PR] Getting default branch for ${owner}/${repo}...`);

    let defaultBranch = 'main';
    let baseSha;

    try {
      const refData = await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/main`);
      baseSha = refData.object.sha;
    } catch (err) {
      if (err.status === 404) {
        // Try 'master' as fallback
        try {
          const refData = await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/master`);
          baseSha = refData.object.sha;
          defaultBranch = 'master';
        } catch (masterErr) {
          if (masterErr.status === 404) {
            return res.status(404).json({
              error: 'Repository not found or no access. Is it private?',
            });
          }
          throw masterErr;
        }
      } else if (err.status === 401) {
        return res.status(401).json({
          error: 'Invalid GitHub token — check that it has repo scope',
        });
      } else {
        throw err;
      }
    }

    // ── Step 2: Create new branch ──
    const timestamp = Date.now();
    const newBranch = `agentlens-fixes-${timestamp}`;

    console.log(`[GitHub PR] Creating branch ${newBranch} from ${baseSha.slice(0, 7)}...`);

    try {
      await ghFetch(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha: baseSha,
        }),
      });
    } catch (err) {
      if (err.status === 422) {
        return res.status(422).json({
          error: 'Branch already exists — try again',
        });
      }
      throw err;
    }

    // ── Step 3: Update each file ──
    console.log(`[GitHub PR] Uploading ${edits.length} file(s)...`);

    for (const edit of edits) {
      const filePath = edit.file.replace(/^\//, ''); // Remove leading slash
      const commitMessage = edit.explanation || `AgentLens: update ${filePath}`;

      // Get current file SHA (if file exists)
      let fileSha = null;
      try {
        const fileData = await ghFetch(
          `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${newBranch}`
        );
        fileSha = fileData.sha;
      } catch (err) {
        // 404 means new file — that's fine, fileSha stays null
        if (err.status !== 404) throw err;
      }

      // Base64 encode content (handle unicode)
      const content = Buffer.from(edit.newContent || '', 'utf-8').toString('base64');

      const putBody = {
        message: commitMessage,
        content,
        branch: newBranch,
      };
      if (fileSha) {
        putBody.sha = fileSha;
      }

      await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        body: JSON.stringify(putBody),
      });
    }

    // ── Step 4: Create PR ──
    console.log(`[GitHub PR] Creating pull request...`);

    const prBodyText =
      prBody || buildPRBody(edits);
    const prTitleText =
      prTitle || 'AgentLens: AI-powered fixes and improvements';

    const prData = await ghFetch(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: prTitleText,
        body: prBodyText,
        head: newBranch,
        base: defaultBranch,
      }),
    });

    console.log(`[GitHub PR] ✅ PR created: ${prData.html_url}`);

    return res.json({
      prUrl: prData.html_url,
      prNumber: prData.number,
      branch: newBranch,
      filesChanged: edits.length,
    });
  } catch (err) {
    console.error('[GitHub PR] Error:', err.message);

    // Map known GitHub errors
    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    if (err.status === 404) {
      return res.status(404).json({ error: 'Repo not found or no access' });
    }
    if (err.status === 422) {
      return res.status(422).json({
        error: 'Branch already exists — try again',
      });
    }

    return res.status(500).json({
      error: err.message || 'Failed to create pull request',
    });
  }
});

/**
 * Build a markdown PR body from edits array
 */
function buildPRBody(edits) {
  const header = `## 🔍 AgentLens AI Fixes

This PR was automatically generated by [AgentLens](https://agentlens.dev) — an AI-powered codebase analysis tool.

### Changes
`;

  const changeList = edits
    .map((e) => {
      const explanation = e.explanation || 'AI-suggested improvement';
      return `- **${e.file}**: ${explanation}`;
    })
    .join('\n');

  const footer = `

---
*Generated by AgentLens on ${new Date().toISOString().split('T')[0]}*`;

  return header + changeList + footer;
}

export default router;