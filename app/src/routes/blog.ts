import express from "express";
import BlogController from "../controllers/blog";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";

const router = express.Router();

router.get("/", adminAuthMiddleware, BlogController.getBlogs);
router.get("/:id", adminAuthMiddleware, BlogController.getBlogById);
router.post("/", adminAuthMiddleware, BlogController.createBlog);
router.put("/:id", adminAuthMiddleware, BlogController.updateBlog);
router.delete("/:id", adminAuthMiddleware, BlogController.deleteBlog);

export default router; 