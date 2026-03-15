import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Route imports
import analyzeRoute from './routes/analyzeRoute.js';
import githubRoute from './routes/githubRoute.js';
import userRouter from './routes/userRoute.js';
import historyRouter from './routes/historyRoute.js';
import fixRouter from './routes/fixRoute.js';

// Service imports
import { checkProviderHealth } from './llm/llmService.js';
import { getActiveSessions } from './memory/sharedMemory.js';
import { testSupabaseConnection } from './db/supabase.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

// Enable CORS for frontend dev server
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: false, // SSE needs this off
  crossOriginEmbedderPolicy: false,
}));

// General rate limiter (all routes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Strict rate limiter for analyze route
const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Analysis rate limit exceeded. Please wait before analyzing again.' },
  keyGenerator: (req) => req.headers.authorization || req.ip,
});
app.use('/api/analyze', analyzeLimiter);

// Parse JSON bodies with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// HEALTH & STATUS ENDPOINTS
// ===========================================

// Enhanced health check - used by monitoring and load balancers
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    activeSessions: getActiveSessions().length,
  });
});

// Detailed status endpoint - shows provider health and memory usage
app.get('/api/status', async (req, res) => {
  try {
    const healthResult = await checkProviderHealth();
    res.json({
      providers: healthResult,
      activeSessions: getActiveSessions(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// API ROUTES
// ===========================================

// GitHub API proxy routes (fetch repos, files, etc.)
app.use('/api/github', githubRoute);

// Analysis pipeline routes (start analysis, stream results)
app.use('/api/analyze', analyzeRoute);

// User profile routes (get/update profile, requires Clerk auth)
app.use('/api/user', userRouter);

// Analysis history routes (list, view, delete saved analyses)
app.use('/api/history', historyRouter);

// Fix agent routes (fix bugs, stream results)
app.use('/api/fix', fixRouter);

// ===========================================
// ERROR HANDLING
// ===========================================

// Global error handler - catches unhandled errors from routes
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large' });
  }
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    // Only include stack trace in development for debugging
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// ===========================================
// SERVER STARTUP
// ===========================================

app.listen(PORT, async () => {
  console.log('\n🔍 AgentLens Server v2.0.0');
  console.log('==================');
  console.log('Port:', PORT);
  console.log('Mode:', process.env.NODE_ENV || 'development');
  console.log('Frontend:', 'http://localhost:5173');
  console.log('Health:', `http://localhost:${PORT}/health`);
  console.log('Security: Helmet enabled, rate limiting active');
  console.log('==================\n');

  // Test database connection on startup
  // Logs success/failure but doesn't block server start
  await testSupabaseConnection();
});