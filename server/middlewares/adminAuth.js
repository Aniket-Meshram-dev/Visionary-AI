import { supabaseAdmin } from '../configs/supabase.js';

/**
 * Admin Authentication & Authorization Middleware
 * Verifies Supabase Auth token AND confirms the user is a designated administrator.
 */
export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Admin access required.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization token.',
      });
    }

    // Verify token using Supabase Admin Auth
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please sign in as an admin.',
      });
    }

    // Strict single admin account enforcement
    const userEmail = (user.email || '').toLowerCase();
    const FIXED_ADMIN_EMAIL = 'admin@gmail.com';
    const isAuthorizedAdmin = userEmail === FIXED_ADMIN_EMAIL;

    if (!isAuthorizedAdmin) {
      console.warn(`[SECURITY] Unauthorized Admin attempt by: ${userEmail} (${user.id})`);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not possess administrator privileges.',
      });
    }

    // Attach admin identity to request
    req.adminUser = user;
    req.userId = user.id;
    req.isAdmin = true;

    next();
  } catch (error) {
    console.error('adminAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Admin authorization failed.',
    });
  }
};

export default adminAuth;
