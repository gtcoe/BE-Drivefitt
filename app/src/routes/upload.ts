import { Router } from "express";
import uploadController from "../controllers/upload";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware";
import upload from "../config/multer";

const router = Router();

router.get("/config", uploadController.getUploadConfig);

router.post(
  "/single",
  adminAuthMiddleware,
  upload.single('file'),
  uploadController.uploadSingleImage
);

router.post(
  "/multiple",
  adminAuthMiddleware,
  upload.array('files', 10),
  uploadController.uploadMultipleImages
);

router.delete(
  "/delete",
  adminAuthMiddleware,
  uploadController.deleteImage
);

router.post(
  "/convertToCompressedWebP",
  upload.single('file'),
  uploadController.convertSvgToWebP
);

export default router; 