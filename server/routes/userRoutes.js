import express from "express";
import { auth, optionalAuth } from "../middlewares/auth.js";
import {
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
  deleteUserCreation,
  getUserProfile,
  upgradePlan,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", optionalAuth, getPublishedCreations);
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);
userRouter.delete("/delete-creation/:id", auth, deleteUserCreation);
userRouter.get("/profile", auth, getUserProfile);
userRouter.post("/upgrade-plan", auth, upgradePlan);

export default userRouter;
