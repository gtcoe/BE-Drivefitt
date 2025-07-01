import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  createUserDetails,
  createSubscription,
  getAllUsers,
  getAllSubscriptions,
} from "../controllers/user";
import userAuthMiddleware from "../middleware/userAuthMiddleware";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = Router();

// Public routes for Brand Website (no authentication required)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/user-details", createUserDetails);
router.post("/subscription", createSubscription);

// Protected user routes (requires user authentication)
router.get("/profile", userAuthMiddleware, getUserProfile);
router.put("/profile", userAuthMiddleware, updateUserProfile);

// Admin routes (requires admin authentication)
router.get("/admin/users", adminAuthMiddleware, getAllUsers);
router.get("/admin/subscriptions", adminAuthMiddleware, getAllSubscriptions);

export default router; 