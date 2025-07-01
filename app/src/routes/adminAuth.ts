import { Router } from "express";
import AdminAuthController from "../controllers/adminAuth";

const router = Router();

// Admin login
// POST /admin/auth/login
router.post("/login", AdminAuthController.signIn);

// Change password (requires authentication)
// POST /admin/auth/change-password
router.post("/change-password", AdminAuthController.changePassword);

export default router; 