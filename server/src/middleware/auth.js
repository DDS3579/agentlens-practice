import { createClerkClient, verifyToken } from "@clerk/backend";
import { upsertUser } from "../db/userService.js";
import { getUserApiKeys } from "../db/userService.js";
import { decrypt } from "../utils/Encryption.js";

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// requireAuth — verifies the JWT token from Authorization header
// Attaches req.auth = { userId, sessionClaims } on success
export const requireAuth = async (req, res, next) => {
  // Request logging
  console.log(`[Auth] ${req.method} ${req.path} - ${new Date().toISOString()}`);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      code: "NO_TOKEN",
      message: "Please sign in to access this resource",
    });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    req.auth = {
      userId: payload.sub,
      sessionClaims: payload,
      email: payload.email,
    };

    // Check if token is about to expire (within 5 minutes)
    if (payload.exp) {
      const expiresAt = payload.exp * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt - Date.now() < fiveMinutes) {
        res.setHeader("X-Token-Expiring", "true");
      }
    }

    next();
  } catch (err) {
    console.error(`[Auth] Token verification failed: ${err.message}`);
    return res.status(401).json({
      error: "Invalid token",
      code: "INVALID_TOKEN",
      message: "Your session has expired. Please sign in again.",
    });
  }
};

// optionalAuth — same as requireAuth but doesn't block unauthenticated requests
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.auth = {};
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    req.auth = {
      userId: payload.sub,
      sessionClaims: payload,
      email: payload.email,
    };
  } catch (err) {
    // Non-blocking — just proceed without auth
    req.auth = {};
  }

  next();
};

// syncUser — syncs the authenticated user to our database
export async function syncUser(req, res, next) {
  try {
    if (!req.auth?.userId) {
      return next();
    }

    const { userId, sessionClaims } = req.auth;

    // Extract user info from session claims
    const email =
      sessionClaims?.email || sessionClaims?.primary_email_address || null;
    const name = sessionClaims?.name || sessionClaims?.full_name || null;
    const imageUrl =
      sessionClaims?.image_url || sessionClaims?.profile_image_url || null;

    // Upsert user to database
    await upsertUser({
      clerk_id: userId,
      email,
      name,
      image_url: imageUrl,
    });

    next();
  } catch (error) {
    console.error("Error syncing user:", error);
    // Don't block the request if sync fails
    next();
  }
}

// attachLLMConfig — fetches user's active LLM config and attaches to req.userLLMConfig
export async function attachLLMConfig(req, res, next) {
  try {
    const headerProvider = req.headers["x-llm-provider"];
    const headerApiKey = req.headers["x-llm-api-key"];
    const headerModel = req.headers["x-llm-model"];
    const headerBaseUrl = req.headers["x-llm-base-url"];

    if (headerProvider) {
      console.log(
        `[LLM Config] Using header override: provider=${headerProvider}, model=${headerModel || "default"}`,
      );

      req.llmConfig = {
        provider: headerProvider,
        apiKey: headerApiKey || "", // Empty for Ollama
        model: headerModel || null,
        baseUrl: headerBaseUrl || null, // For Ollama custom URL
        source: "header", // Track where config came from
      };

      // Validate provider
      const validProviders = ["groq", "ollama", "openai", "anthropic"];
      if (!validProviders.includes(headerProvider)) {
        console.warn(
          `[LLM Config] Invalid provider in header: ${headerProvider}`,
        );
        req.llmConfig = null;
      }

      return next();
    }

    // ============================================
    // DATABASE CONFIG — User's stored API keys
    // ============================================
    if (!req.auth?.userId) {
      req.llmConfig = null;
      return next();
    }

    const keys = await getUserApiKeys(req.auth.userId);
    const activeKey = keys.find((k) => k.is_active);

    if (!activeKey) {
      req.llmConfig = null;
      return next();
    }

    console.log(
      `[LLM Config] Using database config: provider=${activeKey.provider}`,
    );

    req.llmConfig = {
      provider: activeKey.provider,
      apiKey: activeKey.encrypted_key ? decrypt(activeKey.encrypted_key) : null,
      model: activeKey.model_name || null,
      baseUrl: activeKey.ollama_url || null,
      source: "database",
    };

    next();
  } catch (err) {
    console.error("[LLM Config] Error attaching config:", err.message);
    req.llmConfig = null;
    next();
  }
}
