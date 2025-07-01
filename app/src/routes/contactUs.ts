import express from "express";
import ContactUsController from "../controllers/contactUs";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = express.Router();

router.get("/", adminAuthMiddleware, ContactUsController.getContactUsEntries);
router.get("/export", adminAuthMiddleware, ContactUsController.exportContactUsData);

export default router; 