import sql from "../configs/db.js";


export const getUserCreations = async (req, res)=>{
    try {
        const {userId} = req.auth()

       const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

        res.json({ success: true, creations });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const getPublishedCreations = async (req, res)=>{
    try {

       const creations = await sql`
       SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

        res.json({ success: true, creations });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const toggleLikeCreation = async (req, res)=>{
    try {

        const {userId} = req.auth()
        const {id} = req.body

        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`

        if(!creation){
            return res.json({ success: false, message: "Creation not found" })
        }

        const currentLikes = creation.likes;
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;

        if(currentLikes.includes(userIdStr)){
            updatedLikes = currentLikes.filter((user)=>user !== userIdStr);
            message = 'Creation Unliked'
        }else{
            updatedLikes = [...currentLikes, userIdStr]
            message = 'Creation Liked'
        }

        const formattedArray = `{${updatedLikes.join(',')}}`

       await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

        res.json({ success: true, message });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const deleteUserCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    // Check if creation exists and belongs to the current user
    const [creation] = await sql`
      SELECT * FROM creations WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!creation) {
      return res.json({
        success: false,
        message: "Creation not found or not authorized"
      });
    }

    // Delete the creation
    await sql`DELETE FROM creations WHERE id = ${id} AND user_id = ${userId}`;

    res.json({ success: true, message: "Creation deleted successfully" });
  } catch (error) {
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

