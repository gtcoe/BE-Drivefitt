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
      const { uploadPath = "GENERAL", quality, width, height, maintainAspectRatio } = req.body;
      
      if (!req.file) {
        const response = new ResponseModel(false, 400);
        response.setMessage("No SVG file provided");
        res.status(400).json(response);
        return;
      }

      const validation = imageProcessingService.validateSvgFile(req.file);
      if (!validation.isValid) {
        const response = new ResponseModel(false, 400);
        response.setMessage(validation.error || "Invalid SVG file");
        res.status(400).json(response);
        return;
      }

      const validUploadPaths = Object.keys(constants.S3.UPLOAD_PATHS);
      const finalUploadPath = validUploadPaths.includes(uploadPath) 
        ? uploadPath as keyof typeof constants.S3.UPLOAD_PATHS
        : "GENERAL";

      const conversionOptions = {
        quality: quality ? Math.max(constants.SVG_PROCESSING.MIN_QUALITY, Math.min(constants.SVG_PROCESSING.MAX_QUALITY, parseInt(quality))) : constants.SVG_PROCESSING.DEFAULT_QUALITY,
        width: width ? parseInt(width) : constants.SVG_PROCESSING.DEFAULT_WIDTH,
        height: height ? parseInt(height) : constants.SVG_PROCESSING.DEFAULT_HEIGHT,
        maintainAspectRatio: maintainAspectRatio !== 'false'
      };

      const processingResult = await imageProcessingService.processAndOptimizeImage(
        req.file.buffer,
        req.file.originalname,
        conversionOptions
      );

      if (!processingResult.success || !processingResult.processedFile) {
        const response = new ResponseModel(false, 400);
        response.setMessage(processingResult.error || "SVG processing failed");
        res.status(400).json(response);
        return;
      }

      const uploadResult = await s3UploadService.uploadFile(processingResult.processedFile, finalUploadPath);

      if (uploadResult.success) {
        const response = new ResponseModel(true, 200);
        response.setMessage("SVG converted to WebP and uploaded successfully");
        response.setData("uploadResult", {
          url: uploadResult.url,
          originalName: req.file.originalname,
          convertedName: processingResult.processedFile.originalname,
          originalSize: req.file.size,
          convertedSize: processingResult.processedFile.size,
          compressionRatio: processingResult.metadata?.compressionRatio,
          conversionOptions,
          uploadPath: finalUploadPath,
          metadata: processingResult.metadata
        });
        res.status(200).json(response);
      } else {
        const response = new ResponseModel(false, 400);
        response.setMessage(uploadResult.error || "Upload failed");
        res.status(400).json(response);
      }

    } catch (error) {
      logger.error("SVG conversion controller error:", error);
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
        uploadPaths: Object.keys(constants.S3.UPLOAD_PATHS),
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
          defaultDimensions: {
            width: constants.SVG_PROCESSING.DEFAULT_WIDTH,
            height: constants.SVG_PROCESSING.DEFAULT_HEIGHT
          }
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