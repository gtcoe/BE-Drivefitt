import express from "express";
import adminAuthRoutes from "./adminAuth";
import blogRoutes from "./blog";
import careerRoutes from "./career";
import contactUsRoutes from "./contactUs";
import franchiseRoutes from "./franchise";
import paymentRoutes from "./payment";
import userLoginRoutes from "./userLogin";
import userRoutes from "./user";
import uploadRoutes from "./upload";

const router = express.Router();

// Admin routes (requires admin authentication)
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/blogs", blogRoutes);
router.use("/admin/careers", careerRoutes);
router.use("/admin/contact-us", contactUsRoutes);
router.use("/admin/franchise", franchiseRoutes);
router.use("/admin/payments", paymentRoutes);
router.use("/admin/user-logins", userLoginRoutes);
router.use("/admin/upload", uploadRoutes);

// User management routes (both public and protected)
router.use("/users", userRoutes);

// Public routes for Brand Website (no authentication required)
// Public Blog Routes - Only published blogs (status = 1)
router.get("/public/blogs", (req, res) => {
  req.query.status = "1"; // Only published blogs
  const blogController = require("../controllers/blog").default;
  return blogController.getBlogs(req, res);
});

router.get("/public/blogs/:id", (req, res) => {
  req.query.status = "1"; // Only published blogs
  const blogController = require("../controllers/blog").default;
  return blogController.getBlogById(req, res);
});

// Public Career Routes - Only active careers (status = 1)
router.get("/public/careers", (req, res) => {
  req.query.status = "1"; // Only active careers
  const careerController = require("../controllers/career").default;
  return careerController.getCareers(req, res);
});

router.get("/public/careers/:id", (req, res) => {
  req.query.status = "1"; // Only active careers
  const careerController = require("../controllers/career").default;
  return careerController.getCareerById(req, res);
});

// Public form submission routes
router.post("/public/contact", (req, res) => {
  const contactUsController = require("../controllers/contactUs").default;
  return contactUsController.createContactUs(req, res);
});

router.post("/public/franchise", (req, res) => {
  const franchiseController = require("../controllers/franchise").default;
  return franchiseController.createFranchiseInquiry(req, res);
});

export default router;
