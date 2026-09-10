import { supabaseAdmin } from "../configs/supabase.js";

export const getUserCreations = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;

    const { data: creations, error } = await supabaseAdmin
      .from("creations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, creations: creations || [] });
  } catch (error) {
    console.error("getUserCreations error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const { data: creations, error } = await supabaseAdmin
      .from("creations")
      .select("*")
      .eq("publish", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, creations: creations || [] });
  } catch (error) {
    console.error("getPublishedCreations error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const toggleLikeCreation = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { id } = req.body;

    const { data: creation, error: fetchErr } = await supabaseAdmin
      .from("creations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const currentLikes = Array.isArray(creation.likes) ? creation.likes : [];
    const userIdStr = userId.toString();
    let updatedLikes;
    let message;

    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("creations")
      .update({ likes: updatedLikes })
      .eq("id", id);

    if (updateErr) throw updateErr;

    res.json({ success: true, message });
  } catch (error) {
    console.error("toggleLikeCreation error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteUserCreation = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.()?.userId;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("creations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res.json({ success: true, message: "Creation deleted successfully" });
  } catch (error) {
    console.error("deleteUserCreation error:", error.message);
    res.json({ success: false, message: error.message });
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
    const { plan = "premium" } = req.body;
    const updated = await updateUserPlan(req.userId, plan);

    if (updated) {
      res.json({ success: true, message: `Successfully upgraded to ${plan} plan!` });
    } else {
      res.json({ success: false, message: "Failed to update plan." });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
