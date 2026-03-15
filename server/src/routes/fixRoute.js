// server/src/routes/fixRoute.js

import { Router } from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import { requirePro, attachUser } from '../middleware/planCheck.js';
import { fixSingleBug, fixAllBugs, groupBugsByFile } from '../agents/fixAgent.js';
import { getAnalysisById } from '../db/analysisService.js';
import { getUserApiKeys } from '../db/userService.js';

const router = Router();

/**
 * Set up SSE headers and return sendEvent helper
 * @param {Response} res - Express response object
 * @returns {Function} sendEvent function
 */
function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  return sendEvent;
}

/**
 * Get user's LLM config from their API keys
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User LLM config or null
 */
async function getUserLLMConfig(userId) {
  try {
    const apiKeys = await getUserApiKeys(userId);
    
    if (!apiKeys || apiKeys.length === 0) {
      return null;
    }

    // Find the active/default key
    const activeKey = apiKeys.find(key => key.isActive || key.isDefault) || apiKeys[0];
    
    if (!activeKey) {
      return null;
    }

    return {
      provider: activeKey.provider,
      apiKey: activeKey.apiKey,
      ollamaUrl: activeKey.ollamaUrl,
      modelName: activeKey.modelName
    };
  } catch (error) {
    // If we can't get user keys, return null to use platform defaults
    return null;
  }
}

/**
 * POST /single
 * Fix a single bug with SSE streaming
 */
router.post(
  '/single',
  requireAuth,
  syncUser,
  attachUser,
  requirePro,
  async (req, res) => {
    const sendEvent = setupSSE(res);

    try {
      const { bugId, bug, fileContent, analysisId } = req.body;

      // Validate required fields
      if (!bug || !fileContent) {
        sendEvent('fix_error', { 
          error: 'Missing required fields: bug and fileContent are required' 
        });
        res.end();
        return;
      }

      // Ensure bug has an ID
      const bugWithId = { ...bug, id: bugId || bug.id || `bug_${Date.now()}` };

      // Send session start event
      sendEvent('fix_session_start', {
        bugId: bugWithId.id,
        file: bugWithId.file,
        analysisId
      });

      // Get user's LLM config
      const userLLMConfig = await getUserLLMConfig(req.auth.userId);

      // Create progress callback
      const onProgress = async (event, data) => {
        sendEvent(event, data);
      };

      // Call fix agent
      const result = await fixSingleBug(bugWithId, fileContent, onProgress, userLLMConfig);

      // Send session complete event
      sendEvent('fix_session_complete', {
        bugId: bugWithId.id,
        success: result.success,
        error: result.error
      });

      res.end();

    } catch (error) {
      sendEvent('fix_error', { 
        error: error.message || 'An unexpected error occurred' 
      });
      res.end();
    }
  }
);

/**
 * POST /all
 * Fix all bugs with SSE streaming
 */
router.post(
  '/all',
  requireAuth,
  syncUser,
  attachUser,
  requirePro,
  async (req, res) => {
    const sendEvent = setupSSE(res);

    try {
      const { bugs, fileContents, analysisId } = req.body;

      // Validate required fields
      if (!bugs || !Array.isArray(bugs) || bugs.length === 0) {
        sendEvent('fix_error', { 
          error: 'Missing required fields: bugs array is required and cannot be empty' 
        });
        res.end();
        return;
      }

      if (!fileContents || typeof fileContents !== 'object') {
        sendEvent('fix_error', { 
          error: 'Missing required fields: fileContents object is required' 
        });
        res.end();
        return;
      }

      // Ensure all bugs have IDs
      const bugsWithIds = bugs.map((bug, index) => ({
        ...bug,
        id: bug.id || `bug_${Date.now()}_${index}`
      }));

      // Send session start event
      sendEvent('fix_session_start', {
        total: bugsWithIds.length,
        files: Object.keys(groupBugsByFile(bugsWithIds)),
        analysisId
      });

      // Get user's LLM config
      const userLLMConfig = await getUserLLMConfig(req.auth.userId);

      // Create getFileContent function
      const getFileContent = async (filePath) => {
        const content = fileContents[filePath];
        if (content === undefined) {
          throw new Error(`File content not provided for: ${filePath}`);
        }
        return content;
      };

      // Create progress callback
      const onProgress = async (event, data) => {
        sendEvent(event, data);
      };

      // Call fix agent for all bugs
      const results = await fixAllBugs(bugsWithIds, getFileContent, onProgress, userLLMConfig);

      // Calculate summary
      const fixed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Send session complete event with summary
      sendEvent('fix_session_complete', {
        summary: {
          total: results.length,
          fixed,
          failed
        },
        results: results.map(r => ({
          bugId: r.bug.id,
          file: r.bug.file,
          success: r.success,
          error: r.error
        }))
      });

      res.end();

    } catch (error) {
      sendEvent('fix_error', { 
        error: error.message || 'An unexpected error occurred' 
      });
      res.end();
    }
  }
);

export default router;