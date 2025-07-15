import express from "express";
import UserLoginController from "../controllers/userLogin";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = express.Router();
router.get("/", adminAuthMiddleware, UserLoginController.getUserLogins);
router.get("/export", adminAuthMiddleware, UserLoginController.exportUserLoginData);

export default router; 