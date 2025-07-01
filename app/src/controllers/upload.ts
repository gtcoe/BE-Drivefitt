import { Request, Response } from "express";
import s3UploadService from "../services/s3Upload";
import imageProcessingService from "../services/imageProcessing";
import ResponseModel from "../models/response";
import constants from "../config/constants/drivefitt-constants";
import { logger } from "../logging";

class UploadController {
  async uploadSingleImage(req: Request, res: Response): Promise<void> {
    try {
      const { uploadPath = "GENERAL" } = req.body;
      
      if (!req.file) {
        const response = new ResponseModel(false, 400);
        response.setMessage("No file provided");
        res.status(400).json(response);
        return;
      }

      const validUploadPaths = Object.keys(constants.S3.UPLOAD_PATHS);
      const finalUploadPath = validUploadPaths.includes(uploadPath) 
        ? uploadPath as keyof typeof constants.S3.UPLOAD_PATHS
        : "GENERAL";

      const result = await s3UploadService.uploadFile(req.file, finalUploadPath);

      if (result.success) {
        const response = new ResponseModel(true, 200);
        response.setMessage("Image uploaded successfully");
        response.setData("uploadResult", {
          url: result.url,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          uploadPath: finalUploadPath
        });
        res.status(200).json(response);
      } else {
        const response = new ResponseModel(false, 400);
        response.setMessage(result.error || "Upload failed");
        res.status(400).json(response);
      }

    } catch (error) {
      logger.error("Upload controller error:", error);
      const response = new ResponseModel(false, 500);
      response.setMessage("Internal server error");
      res.status(500).json(response);
    }
  }

  async uploadMultipleImages(req: Request, res: Response): Promise<void> {
    try {
      const { uploadPath = "GENERAL" } = req.body;
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        const response = new ResponseModel(false, 400);
        response.setMessage("No files provided");
        res.status(400).json(response);
        return;
      }

      const validUploadPaths = Object.keys(constants.S3.UPLOAD_PATHS);
      const finalUploadPath = validUploadPaths.includes(uploadPath) 
        ? uploadPath as keyof typeof constants.S3.UPLOAD_PATHS
        : "GENERAL";

      const result = await s3UploadService.uploadMultipleFiles(req.files, finalUploadPath);

      if (result.success) {
        const response = new ResponseModel(true, 200);
        response.setMessage("Images uploaded successfully");
        response.setData("uploadResult", {
          urls: result.urls,
          uploadedCount: result.urls?.length || 0,
          totalFiles: req.files.length,
          errors: result.errors,
          uploadPath: finalUploadPath
        });
        res.status(200).json(response);
      } else {
        const response = new ResponseModel(false, 400);
        response.setMessage("Upload failed");
        response.setData("uploadResult", {
          errors: result.errors,
          uploadedCount: 0,
          totalFiles: req.files.length
        });
        res.status(400).json(response);
      }

    } catch (error) {
      logger.error("Multiple upload controller error:", error);
      const response = new ResponseModel(false, 500);
      response.setMessage("Internal server error");
      res.status(500).json(response);
    }
  }

  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        const response = new ResponseModel(false, 400);
        response.setMessage("Image URL is required");
        res.status(400).json(response);
        return;
      }

      const result = await s3UploadService.deleteFile(imageUrl);

      if (result.success) {
        const response = new ResponseModel(true, 200);
        response.setMessage("Image deleted successfully");
        res.status(200).json(response);
      } else {
        const response = new ResponseModel(false, 400);
        response.setMessage(result.error || "Delete failed");
        res.status(400).json(response);
      }

    } catch (error) {
      logger.error("Delete controller error:", error);
      const response = new ResponseModel(false, 500);
      response.setMessage("Internal server error");
      res.status(500).json(response);
    }
  }

  async convertSvgToWebP(req: Request, res: Response): Promise<void> {
    try {
      const { quality, width, height, maintainAspectRatio } = req.body;
      
      if (!req.file) {
        const response = new ResponseModel(false, 400);
        response.setMessage("No image file provided");
        res.status(400).json(response);
        return;
      }

      const conversionOptions = {
        quality: quality ? Math.max(constants.IMAGE_PROCESSING.MIN_QUALITY, Math.min(constants.IMAGE_PROCESSING.MAX_QUALITY, parseInt(quality))) : constants.IMAGE_PROCESSING.DEFAULT_QUALITY,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        maintainAspectRatio: maintainAspectRatio !== 'false'
      };

      const processingResult = await imageProcessingService.processAndOptimizeImage(
        req.file.buffer,
        req.file.originalname,
        conversionOptions
      );

      if (!processingResult.success || !processingResult.processedFile || !processingResult.originalWebpFile || !processingResult.originalFile) {
        const response = new ResponseModel(false, 400);
        response.setMessage(processingResult.error || "Image processing failed");
        res.status(400).json(response);
        return;
      }

      // Upload to all three folders
      const [compressedUpload, originalWebpUpload, originalUpload] = await Promise.all([
        s3UploadService.uploadFile(processingResult.processedFile, "COMPRESSED_WEBP"),
        s3UploadService.uploadFile(processingResult.originalWebpFile, "ORIGINAL_WEBP"),
        s3UploadService.uploadFile(processingResult.originalFile, "ORIGINAL_IMAGES")
      ]);

      if (compressedUpload.success && originalWebpUpload.success && originalUpload.success) {
        const response = new ResponseModel(true, 200);
        response.setMessage("Image processed and uploaded to all folders successfully");
        response.setData("uploadResult", {
          compressedWebp: {
            url: compressedUpload.url,
            sizeKB: Number((processingResult.processedFile.size / 1024).toFixed(2)),
            folder: "images/"
          },
          originalWebp: {
            url: originalWebpUpload.url,
            sizeKB: Number((processingResult.originalWebpFile.size / 1024).toFixed(2)),
            folder: "original-webp-images/"
          },
          originalImage: {
            url: originalUpload.url,
            sizeKB: Number((processingResult.originalFile.size / 1024).toFixed(2)),
            folder: "original-images/"
          },
          originalName: req.file.originalname,
          convertedName: processingResult.processedFile.originalname,
          compressionRatio: processingResult.metadata?.compressionRatio,
          conversionOptions,
          metadata: {
            originalFormat: processingResult.metadata?.originalFormat,
            originalSizeKB: processingResult.metadata?.originalSize,
            convertedSizeKB: processingResult.metadata?.convertedSize,
            compressionRatio: processingResult.metadata?.compressionRatio,
            width: processingResult.metadata?.width,
            height: processingResult.metadata?.height
          }
        });
        res.status(200).json(response);
      } else {
        const response = new ResponseModel(false, 400);
        response.setMessage("Upload failed: " + [
          !compressedUpload.success ? "Compressed WebP: " + compressedUpload.error : "",
          !originalWebpUpload.success ? "Original WebP: " + originalWebpUpload.error : "",
          !originalUpload.success ? "Original Image: " + originalUpload.error : ""
        ].filter(Boolean).join(", "));
        res.status(400).json(response);
      }

    } catch (error) {
      logger.error("Image conversion controller error:", error);
      const response = new ResponseModel(false, 500);
      response.setMessage("Internal server error");
      res.status(500).json(response);
    }
  }

  async getUploadConfig(_req: Request, res: Response): Promise<void> {
    try {
      const response = new ResponseModel(true, 200);
      response.setMessage("Upload configuration");
      response.setData("config", {
        maxFileSize: constants.S3.MAX_FILE_SIZE,
        allowedTypes: constants.S3.ALLOWED_TYPES,
        maxFileSizeMB: constants.S3.MAX_FILE_SIZE / 1024 / 1024,
        svgProcessing: {
          maxFileSize: constants.SVG_PROCESSING.MAX_FILE_SIZE,
          allowedTypes: constants.SVG_PROCESSING.ALLOWED_TYPES,
          maxFileSizeMB: constants.SVG_PROCESSING.MAX_FILE_SIZE / 1024 / 1024,
          qualityRange: {
            min: constants.SVG_PROCESSING.MIN_QUALITY,
            max: constants.SVG_PROCESSING.MAX_QUALITY,
            default: constants.SVG_PROCESSING.DEFAULT_QUALITY
          },
          note: "If width/height not provided, original dimensions will be used"
        }
      });
      res.status(200).json(response);
    } catch (error) {
      logger.error("Get upload config error:", error);
      const response = new ResponseModel(false, 500);
      response.setMessage("Internal server error");
      res.status(500).json(response);
    }
  }
}

export default new UploadController(); 