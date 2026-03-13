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

export default router;