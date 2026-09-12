import express from "express";
import { auth, optionalAuth } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
  getPublishedCreations,
  getUserCreations,
  getPublicCreation,
  toggleLikeCreation,
  deleteUserCreation,
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  upgradePlan,
  getPlatformStats,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/platform-stats", getPlatformStats);
userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", optionalAuth, getPublishedCreations);
userRouter.get("/get-creation/:id", getPublicCreation);
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);
userRouter.delete("/delete-creation/:id", auth, deleteUserCreation);
userRouter.get("/profile", auth, getUserProfile);
userRouter.post("/update-profile", auth, upload.single("avatar"), updateUserProfile);
userRouter.post("/update-preferences", auth, updateUserPreferences);
userRouter.post("/upgrade-plan", auth, upgradePlan);

export default userRouter;

