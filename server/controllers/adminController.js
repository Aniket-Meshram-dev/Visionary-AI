import { supabaseAdmin } from '../configs/supabase.js';
import {
  getAllCreationsAdmin as fetchAllCreationsAdmin,
  togglePublishCreation,
  deleteCreation
} from '../services/creationService.js';

/**
 * Check Admin Status
 * Confirms whether the calling authenticated user is an administrator
 */
export const checkAdminStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      isAdmin: true,
      email: req.adminUser.email,
      id: req.adminUser.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Platform Overview Metrics & KPI Stats
 */
export const getAdminOverview = async (req, res) => {
  try {
    // 1. Fetch users from Supabase Auth Admin
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) {
      console.error('Error fetching users from Supabase admin:', usersErr);
    }

    const users = usersData?.users || [];
    const totalUsers = users.length;
    const proUsers = users.filter((u) => u.user_metadata?.plan === 'premium').length;
    const freeUsers = totalUsers - proUsers;
    const estimatedMRR = proUsers * 19; // $19 / mo pro rate

    // 2. Fetch creations metrics
    const allCreations = await fetchAllCreationsAdmin();
    const totalCreations = allCreations.length;
    const publishedCreations = allCreations.filter((c) => c.publish).length;

    // Tool breakdown
    const toolBreakdown = {
      image: allCreations.filter((c) => c.type === 'image').length,
      article: allCreations.filter((c) => c.type === 'article').length,
      'quick-code': allCreations.filter((c) => c.type === 'quick-code').length,
      summary: allCreations.filter((c) => c.type === 'summary').length,
      'resume-review': allCreations.filter((c) => c.type === 'resume-review').length,
    };

    // 3. AI Token Consumption & Infrastructure Cost Telemetry
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalImageGenerations = 0;

    for (const c of allCreations) {
      if (c.type === 'image') {
        totalImageGenerations += 1;
      } else {
        const promptLen = (c.prompt || '').length;
        const contentLen = (c.content || '').length;
        totalInputTokens += Math.round(promptLen / 4) + 150;
        totalOutputTokens += Math.round(contentLen / 4);
      }
    }

    const estimatedCostUsd = Number(
      (
        (totalInputTokens / 1_000_000) * 0.15 +
        (totalOutputTokens / 1_000_000) * 0.60 +
        totalImageGenerations * 0.003
      ).toFixed(4)
    );

    const grossMargin = estimatedMRR > 0
      ? Number((((estimatedMRR - estimatedCostUsd) / estimatedMRR) * 100).toFixed(1))
      : 100;

    const tokenTelemetry = {
      totalTokens: totalInputTokens + totalOutputTokens,
      totalInputTokens,
      totalOutputTokens,
      totalImageGenerations,
      estimatedCostUsd,
      grossMargin,
      averageTokensPerCreation:
        allCreations.length - totalImageGenerations > 0
          ? Math.round(
              (totalInputTokens + totalOutputTokens) /
                (allCreations.length - totalImageGenerations)
            )
          : 0,
    };

    // System Health Status
    const systemHealth = {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      pollinations: Boolean(process.env.POLLINATIONS_API_KEY),
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    };

    res.json({
      success: true,
      stats: {
        totalUsers,
        proUsers,
        freeUsers,
        estimatedMRR,
        totalCreations,
        publishedCreations,
        toolBreakdown,
        tokenTelemetry,
        systemHealth,
      },
    });
  } catch (error) {
    console.error('getAdminOverview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get All Registered Users Directory
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search = '', page = 1, perPage = 50 } = req.query;

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: Number(page),
      perPage: Number(perPage),
    });

    if (error) throw error;

    let users = (data?.users || []).map((u) => {
      const meta = u.user_metadata || {};
      const fullName =
        meta.full_name || meta.name || meta.fullName || (u.email ? u.email.split('@')[0] : 'User');

      return {
        id: u.id,
        email: u.email,
        fullName,
        plan: meta.plan === 'premium' ? 'premium' : 'free',
        usage: typeof meta.free_usage === 'number' ? meta.free_usage : 0,
        isAdmin: meta.is_admin === true || meta.role === 'admin',
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
      };
    });

    // Apply search filter if query provided
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      users = users.filter(
        (u) => u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, users, total: users.length });
  } catch (error) {
    console.error('getAllUsers admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update User Plan & Free Credit Count (Admin manual override)
 */
export const updateUserPlanAndCredits = async (req, res) => {
  try {
    const { targetUserId, plan, freeUsage } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required.' });
    }

    // Fetch existing user to preserve other metadata
    const { data: userData, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(
      targetUserId
    );

    if (fetchErr || !userData?.user) {
      return res.status(404).json({ success: false, message: 'User not found in Supabase Auth.' });
    }

    const currentMeta = userData.user.user_metadata || {};
    const updatedMeta = { ...currentMeta };

    if (plan !== undefined) {
      updatedMeta.plan = plan === 'premium' ? 'premium' : 'free';
    }

    if (freeUsage !== undefined) {
      updatedMeta.free_usage = Math.max(0, Number(freeUsage));
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      user_metadata: updatedMeta,
    });

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: `User ${userData.user.email} updated successfully.`,
      updatedUser: {
        id: targetUserId,
        email: userData.user.email,
        plan: updatedMeta.plan,
        usage: updatedMeta.free_usage,
      },
    });
  } catch (error) {
    console.error('updateUserPlanAndCredits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get All Creations (Community Moderation)
 */
export const getAllCreationsAdmin = async (req, res) => {
  try {
    const { type, publish, search } = req.query;
    let creations = await fetchAllCreationsAdmin();

    if (type && type !== 'all') {
      creations = creations.filter((c) => c.type === type);
    }

    if (publish !== undefined && publish !== 'all') {
      creations = creations.filter((c) => c.publish === (publish === 'true'));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      creations = creations.filter(
        (c) =>
          (c.prompt && c.prompt.toLowerCase().includes(q)) ||
          (c.content && c.content.toLowerCase().includes(q)) ||
          (c.user_id && c.user_id.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, creations, count: creations.length });
  } catch (error) {
    console.error('getAllCreationsAdmin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle Publish / Unpublish Creation (Moderation)
 */
export const toggleCreationPublishAdmin = async (req, res) => {
  try {
    const { creationId } = req.body;

    if (!creationId) {
      return res.status(400).json({ success: false, message: 'Creation ID is required.' });
    }

    const result = await togglePublishCreation(creationId);

    res.json({
      success: true,
      publish: result.publish,
      message: result.message || `Creation has been updated.`,
    });
  } catch (error) {
    console.error('toggleCreationPublishAdmin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Creation (Admin Content Moderation)
 */
export const deleteCreationAdmin = async (req, res) => {
  try {
    const { creationId } = req.params;

    if (!creationId) {
      return res.status(400).json({ success: false, message: 'Creation ID is required.' });
    }

    await deleteCreation(creationId, req.userId, true);

    res.json({ success: true, message: 'Creation deleted permanently by administrator.' });
  } catch (error) {
    console.error('deleteCreationAdmin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
