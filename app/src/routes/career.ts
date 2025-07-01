import { Router } from "express";
import CareerController from "../controllers/career";

const router = Router();

// Get all careers with pagination and search
// GET /admin/careers?page=1&limit=10&status=1&location=Delhi&search=developer
router.get("/", CareerController.getCareers);

// Get career by ID
// GET /admin/careers/123
router.get("/:id", CareerController.getCareerById);

// Create new career
// POST /admin/careers
router.post("/", CareerController.createCareer);

// Update career
// PUT /admin/careers/123
router.put("/:id", CareerController.updateCareer);

// Delete career
// DELETE /admin/careers/123
router.delete("/:id", CareerController.deleteCareer);

export default router; 