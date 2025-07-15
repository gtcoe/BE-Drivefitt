// import sharp from "sharp"; // Temporarily commented out due to Node.js version compatibility
import { logger } from "../logging";
import constants from "../config/constants/drivefitt-constants";

export interface ConversionOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface ConversionResult {
  success: boolean;
  buffer?: Buffer;
  metadata?: {
    originalFormat: string;
    originalSize: number;
    convertedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
  };
  error?: string;
}

class ImageProcessingService {
  private defaultOptions: Required<ConversionOptions> = {
    quality: constants.IMAGE_PROCESSING.DEFAULT_QUALITY,
    width: constants.IMAGE_PROCESSING.DEFAULT_WIDTH,
    height: constants.IMAGE_PROCESSING.DEFAULT_HEIGHT,
    maintainAspectRatio: true,
  };

  async convertToWebP(
    buffer: Buffer,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    // Temporarily disabled due to Sharp module compatibility issues
    logger.error(
      "Image processing temporarily disabled due to Sharp module compatibility with Node.js version"
    );
    return {
      success: false,
      error:
        "Image processing temporarily disabled due to Sharp module compatibility with Node.js version",
    };
  }

  async processAndOptimizeImage(
    buffer: Buffer,
    originalName: string,
    options: ConversionOptions = {}
  ): Promise<
    ConversionResult & {
      processedFile?: Express.Multer.File;
      originalWebpFile?: Express.Multer.File;
      originalFile?: Express.Multer.File;
    }
  > {
    // Temporarily disabled due to Sharp module compatibility issues
    logger.error(
      "Image processing temporarily disabled due to Sharp module compatibility with Node.js version"
    );
    return {
      success: false,
      error:
        "Image processing temporarily disabled due to Sharp module compatibility with Node.js version",
    };
  }

  async validateImageFile(
    buffer: Buffer,
    originalName: string
  ): Promise<{
    isValid: boolean;
    error?: string;
    fileType?: string;
    fileSize?: number;
  }> {
    try {
      // Basic validation without Sharp
      const fileSize = buffer.length;
      const maxSize = constants.IMAGE_PROCESSING.MAX_FILE_SIZE;

      if (fileSize > maxSize) {
        return {
          isValid: false,
          error: `File size (${(fileSize / 1024 / 1024).toFixed(
            2
          )} MB) exceeds the maximum allowed size of ${(
            maxSize /
            1024 /
            1024
          ).toFixed(2)} MB`,
          fileSize,
        };
      }

      // Basic file type validation based on extension
      const extension = originalName.toLowerCase().split(".").pop();
      const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];

      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          isValid: false,
          error:
            "Invalid file type. Only JPG, JPEG, PNG, WebP, and GIF files are allowed",
          fileSize,
        };
      }

      return {
        isValid: true,
        fileType: extension,
        fileSize,
      };
    } catch (error) {
      logger.error("Image validation error:", error);
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : "Unknown validation error",
      };
    }
  }

  async getImageDimensions(buffer: Buffer): Promise<{
    width?: number;
    height?: number;
    error?: string;
  }> {
    // Temporarily disabled due to Sharp module compatibility issues
    logger.error(
      "Image dimension reading temporarily disabled due to Sharp module compatibility with Node.js version"
    );
    return {
      error:
        "Image dimension reading temporarily disabled due to Sharp module compatibility with Node.js version",
    };
  }

  isWebPSupported(): boolean {
    // Always return false since we can't process images without Sharp
    return false;
  }

  calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth?: number,
    targetHeight?: number,
    maintainAspectRatio: boolean = true
  ): { width: number; height: number } {
    if (!targetWidth && !targetHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (!maintainAspectRatio) {
      return {
        width: targetWidth || originalWidth,
        height: targetHeight || originalHeight,
      };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (targetWidth && targetHeight) {
      // Both dimensions provided - choose the one that maintains aspect ratio
      const widthBasedHeight = targetWidth / aspectRatio;
      const heightBasedWidth = targetHeight * aspectRatio;

      if (widthBasedHeight <= targetHeight) {
        return { width: targetWidth, height: Math.round(widthBasedHeight) };
      } else {
        return { width: Math.round(heightBasedWidth), height: targetHeight };
      }
    }

    if (targetWidth) {
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    }

    if (targetHeight) {
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight,
      };
    }

    return { width: originalWidth, height: originalHeight };
  }
}

export default new ImageProcessingService();
