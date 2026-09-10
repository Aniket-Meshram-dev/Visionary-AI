import { supabaseAdmin } from "../configs/supabase.js";

/**
 * Supabase Authentication Middleware
 * Extracts Bearer token from headers, verifies it with Supabase Auth,
 * and attaches user info, plan, and usage to the request object.
 */
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing. Please sign in.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Please sign in.",
      });
    }

    // Verify token using Supabase Admin Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please sign in again.",
      });
    }

    // Extract user metadata (plan & free usage count)
    const userMeta = user.user_metadata || {};
    const plan = userMeta.plan === "premium" ? "premium" : "free";
    const freeUsage = typeof userMeta.free_usage === "number" ? userMeta.free_usage : 0;

    // Attach to request
    req.userId = user.id;
    req.user = user;
    req.plan = plan;
    req.free_usage = freeUsage;

    // Backward compatibility helper for controllers using req.auth()
    req.auth = () => ({
      userId: user.id,
      has: async ({ plan: targetPlan }) => plan === targetPlan,
    });

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

/**
 * Optional Authentication Middleware
 * If token is present and valid, attaches user; otherwise proceeds as guest without blocking.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const userMeta = user.user_metadata || {};
          req.userId = user.id;
          req.user = user;
          req.plan = userMeta.plan === "premium" ? "premium" : "free";
          req.free_usage = typeof userMeta.free_usage === "number" ? userMeta.free_usage : 0;
          req.auth = () => ({ userId: user.id });
        }
      }
    }
  } catch (error) {
    // Non-blocking for optional auth
    console.warn("Optional auth notice:", error.message);
  }
  next();
};

/**
 * Helper to safely increment user free usage count in Supabase Auth metadata
 */
export const incrementUsage = async (userId, currentUsage = 0) => {
  try {
    const nextCount = Number(currentUsage) + 1;
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        free_usage: nextCount,
      },
    });
    return nextCount;
  } catch (error) {
    console.error("Failed to increment user usage in Supabase:", error.message);
    return currentUsage;
  }
};

/**
 * Helper to update user plan (e.g. 'premium' or 'free') in Supabase Auth metadata
 */
export const updateUserPlan = async (userId, plan = "premium") => {
  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        plan,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to update user plan in Supabase:", error.message);
    return false;
  }
};