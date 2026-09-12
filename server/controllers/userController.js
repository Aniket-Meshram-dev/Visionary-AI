import { supabaseAdmin } from "../configs/supabase.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  getUserCreations as fetchUserCreations,
  getPublishedCreations as fetchPublishedCreations,
  getCreationById as fetchCreationById,
  toggleLikeCreation as serviceToggleLike,
  deleteCreation as serviceDeleteCreation,
  readLocalCreations,
} from "../services/creationService.js";

export const getUserCreations = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const creations = await fetchUserCreations(userId);
    res.json({ success: true, creations: creations || [] });
  } catch (error) {
    console.error("getUserCreations error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const creations = await fetchPublishedCreations();
    res.json({ success: true, creations: creations || [] });
  } catch (error) {
    console.error("getPublishedCreations error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getPublicCreation = async (req, res) => {
  try {
    const { id } = req.params;
    const creation = await fetchCreationById(id);
    if (!creation) {
      return res.status(404).json({ success: false, message: "Creation not found" });
    }
    res.json({ success: true, creation });
  } catch (error) {
    console.error("getPublicCreation error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleLikeCreation = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { id } = req.body;
    const result = await serviceToggleLike(id, userId);
    res.json(result);
  } catch (error) {
    console.error("toggleLikeCreation error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteUserCreation = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { id } = req.params;
    const result = await serviceDeleteCreation(id, userId, false);
    if (result.status) {
      return res.status(result.status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("deleteUserCreation error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      userId: req.userId,
      plan: req.plan,
      free_usage: req.free_usage,
      user: {
        id: req.user.id,
        email: req.user.email,
        metadata: req.user.user_metadata,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const upgradePlan = async (req, res) => {
  try {
    const { updateUserPlan } = await import("../middlewares/auth.js");
    const { plan = "premium", promoCode, verificationToken } = req.body;

    // Check if downgrading to free plan
    if (plan === "free") {
      await updateUserPlan(req.userId, "free");
      return res.json({ success: true, message: "Plan downgraded to Free tier successfully." });
    }

    // Security Gate: Upgrading to premium requires authorization
    const userEmail = (req.user?.email || "").toLowerCase();
    const isAdmin = userEmail === 'admin@gmail.com';

    const validPromo =
      process.env.VIP_PROMO_CODE &&
      promoCode &&
      promoCode.trim().toLowerCase() === process.env.VIP_PROMO_CODE.trim().toLowerCase();

    // If not admin and no valid promo code provided, block unauthorized upgrade
    if (!isAdmin && !validPromo) {
      return res.status(403).json({
        success: false,
        message:
          "Payment verification required to upgrade to Pro. Please checkout via Stripe (USD) or Razorpay (INR).",
      });
    }

    const updated = await updateUserPlan(req.userId, plan);

    if (updated) {
      res.json({
        success: true,
        message: `Successfully upgraded to ${plan} plan via authorized channel!`,
      });
    } else {
      res.status(500).json({ success: false, message: "Failed to update plan in database." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    // 1. Fetch real user count from Supabase
    let totalUsers = 0;
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      totalUsers = usersData?.users?.length || 0;
    } catch (e) {
      console.warn("Could not list users for public stats:", e.message);
    }

    // 2. Fetch real creations metrics
    const allCreations = readLocalCreations();
    const totalCreations = allCreations.length;
    const totalImages = allCreations.filter(c => c.type === 'image').length;

    // Calculate total words generated across text creations
    let totalWords = 0;
    for (const c of allCreations) {
      if (c.type !== 'image' && c.content) {
        totalWords += (c.content.match(/\S+/g) || []).length;
      }
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCreations,
        totalImages,
        totalWords,
        activeTools: 7,
      }
    });
  } catch (error) {
    console.error("getPlatformStats error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  const avatarFile = req.file;
  try {
    const userId = req.userId || req.auth?.()?.userId;
    if (!userId) {
      if (avatarFile?.path && fs.existsSync(avatarFile.path)) fs.unlinkSync(avatarFile.path);
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { fullName, headline, bio, preferences } = req.body;
    let avatarUrl = null;

    // 1. If an avatar image file was uploaded, upload to Cloudinary for permanent storage
    if (avatarFile) {
      try {
        const uploadRes = await cloudinary.uploader.upload(avatarFile.path, {
          folder: 'user_avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:best', fetch_format: 'auto' }
          ]
        });
        avatarUrl = uploadRes.secure_url;
      } finally {
        if (avatarFile?.path && fs.existsSync(avatarFile.path)) {
          try { fs.unlinkSync(avatarFile.path); } catch (e) {}
        }
      }
    }

    // 2. Fetch current user metadata
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !userData?.user) {
      return res.status(404).json({ success: false, message: "User not found in authentication system" });
    }

    const currentMeta = userData.user.user_metadata || {};
    let parsedPreferences = currentMeta.preferences || {};
    if (preferences) {
      if (typeof preferences === 'string') {
        try {
          parsedPreferences = { ...parsedPreferences, ...JSON.parse(preferences) };
        } catch (e) {
          console.warn("Could not parse preferences JSON:", e.message);
        }
      } else if (typeof preferences === 'object') {
        parsedPreferences = { ...parsedPreferences, ...preferences };
      }
    }

    const cleanFullName = (fullName !== undefined ? fullName : (currentMeta.full_name || currentMeta.name || '')).trim();

    const updatedMeta = {
      ...currentMeta,
      full_name: cleanFullName,
      name: cleanFullName,
      headline: headline !== undefined ? headline.trim() : (currentMeta.headline || ''),
      bio: bio !== undefined ? bio.trim() : (currentMeta.bio || ''),
      avatar_url: avatarUrl || currentMeta.avatar_url || currentMeta.picture || '',
      preferences: parsedPreferences,
    };

    // 3. Update user metadata in Supabase Auth
    const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMeta
    });

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: updatedUserData.user.id,
        email: updatedUserData.user.email,
        fullName: cleanFullName,
        imageUrl: updatedMeta.avatar_url,
        headline: updatedMeta.headline,
        bio: updatedMeta.bio,
        preferences: updatedMeta.preferences,
        plan: updatedMeta.plan || 'free',
        usage: updatedMeta.free_usage || 0,
        user_metadata: updatedMeta,
      }
    });

  } catch (error) {
    if (avatarFile?.path && fs.existsSync(avatarFile.path)) {
      try { fs.unlinkSync(avatarFile.path); } catch (e) {}
    }
    console.error("updateUserProfile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ success: false, message: "Preferences payload is required" });
    }

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !userData?.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentMeta = userData.user.user_metadata || {};
    const updatedMeta = {
      ...currentMeta,
      preferences: {
        ...(currentMeta.preferences || {}),
        ...preferences,
      }
    };

    const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMeta
    });

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "Preferences updated successfully!",
      preferences: updatedMeta.preferences,
    });
  } catch (error) {
    console.error("updateUserPreferences error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


