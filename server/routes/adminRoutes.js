import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import { adminRateLimiter } from '../middlewares/rateLimiter.js';
import {
  checkAdminStatus,
  getAdminOverview,
  getAllUsers,
  updateUserPlanAndCredits,
  getAllCreationsAdmin,
  toggleCreationPublishAdmin,
  deleteCreationAdmin,
} from '../controllers/adminController.js';

const adminRouter = express.Router();

// Apply rate limiting and admin authentication to all routes in this router
adminRouter.use(adminRateLimiter);
adminRouter.use(adminAuth);

// Admin status & KPI metrics
adminRouter.get('/status', checkAdminStatus);
adminRouter.get('/overview', getAdminOverview);

// User & Subscription Management
adminRouter.get('/users', getAllUsers);
adminRouter.post('/update-user-plan', updateUserPlanAndCredits);

// Content & Community Moderation
adminRouter.get('/creations', getAllCreationsAdmin);
adminRouter.post('/toggle-publish', toggleCreationPublishAdmin);
adminRouter.delete('/delete-creation/:creationId', deleteCreationAdmin);

export default adminRouter;
