import express from "express";
import PaymentController from "../controllers/payment";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = express.Router();

router.get("/", adminAuthMiddleware, PaymentController.getPayments);
router.get("/export", adminAuthMiddleware, PaymentController.exportPaymentData);

export default router; 