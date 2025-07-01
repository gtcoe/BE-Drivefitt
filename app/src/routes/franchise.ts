import express from "express";
import FranchiseController from "../controllers/franchise";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = express.Router();

router.get("/", adminAuthMiddleware, FranchiseController.getFranchiseInquiries);
router.get("/export", adminAuthMiddleware, FranchiseController.exportFranchiseData);

export default router; 