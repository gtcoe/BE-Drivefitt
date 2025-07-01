import sharp from "sharp";
import { logger } from "../logging";
import constants from "../config/constants/drivefitt-constants";

interface ConversionOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

interface ConversionResult {
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
    try {
      const originalSize = buffer.length;
      
      let sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();
      
      // Use original dimensions if width/height not provided
      const targetWidth = options.width || metadata.width || this.defaultOptions.width;
      const targetHeight = options.height || metadata.height || this.defaultOptions.height;
      const quality = options.quality || this.defaultOptions.quality;
      const maintainAspectRatio = options.maintainAspectRatio !== undefined ? options.maintainAspectRatio : this.defaultOptions.maintainAspectRatio;
      
      // Only resize if dimensions are provided or if original dimensions are too large
      if (options.width || options.height || !metadata.width || !metadata.height) {
        if (maintainAspectRatio) {
          sharpInstance = sharpInstance.resize(
            targetWidth,
            targetHeight,
            {
              fit: 'inside',
              withoutEnlargement: true
            }
          );
        } else {
          sharpInstance = sharpInstance.resize(
            targetWidth,
            targetHeight
          );
        }
      }

      const convertedBuffer = await sharpInstance
        .webp({
          quality: quality,
          effort: 6,
          lossless: false
        })
        .toBuffer();

      const convertedMetadata = await sharp(convertedBuffer).metadata();
      const convertedSize = convertedBuffer.length;
      const compressionRatio = Number(((originalSize - convertedSize) / originalSize * 100).toFixed(2));

      logger.info(`Image to WebP conversion successful. Original: ${originalSize} bytes, Converted: ${convertedSize} bytes, Compression: ${compressionRatio}%`);

      return {
        success: true,
        buffer: convertedBuffer,
        metadata: {
          originalFormat: metadata.format || 'unknown',
          originalSize: Number((originalSize / 1024).toFixed(2)),
          convertedSize: Number((convertedSize / 1024).toFixed(2)),
          compressionRatio,
          width: convertedMetadata.width || 0,
          height: convertedMetadata.height || 0,
        }
      };

    } catch (error) {
      logger.error("Image to WebP conversion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown conversion error"
      };
    }
  }

  async processAndOptimizeImage(
    buffer: Buffer,
    originalName: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult & { 
    processedFile?: Express.Multer.File;
    originalWebpFile?: Express.Multer.File;
    originalFile?: Express.Multer.File;
  }> {
    try {
      const validation = await this.validateImageFile(buffer, originalName);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Convert to WebP with original dimensions (no compression/resizing)
      const originalWebpResult = await this.convertToWebP(buffer, { 
        quality: 100,
        maintainAspectRatio: true
      });

      if (!originalWebpResult.success || !originalWebpResult.buffer) {
        return {
          success: false,
          error: originalWebpResult.error || "Original WebP conversion failed"
        };
      }

      // Convert to WebP with compression/resizing options
      const compressedResult = await this.convertToWebP(buffer, options);
      
      if (!compressedResult.success || !compressedResult.buffer) {
        return compressedResult;
      }

      const webpFileName = this.generateWebPFileName(originalName);
      const metadata = await sharp(buffer).metadata();
      
      // Create file objects for all three versions
      const originalFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: originalName,
        encoding: '7bit',
        mimetype: metadata.format ? `image/${metadata.format}` : 'application/octet-stream',
        buffer: buffer,
        size: buffer.length,
        destination: '',
        filename: originalName,
        path: '',
        stream: {} as any
      };

      const originalWebpFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: webpFileName,
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: originalWebpResult.buffer,
        size: originalWebpResult.buffer.length,
        destination: '',
        filename: webpFileName,
        path: '',
        stream: {} as any
      };

      const processedFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: webpFileName,
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: compressedResult.buffer,
        size: compressedResult.buffer.length,
        destination: '',
        filename: webpFileName,
        path: '',
        stream: {} as any
      };

      return {
        ...compressedResult,
        processedFile,
        originalWebpFile,
        originalFile
      };

    } catch (error) {
      logger.error("Image processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown processing error"
      };
    }
  }

  private async validateImageFile(buffer: Buffer, originalName: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!buffer || buffer.length === 0) {
        return { isValid: false, error: "Empty file provided" };
      }

      if (buffer.length > constants.IMAGE_PROCESSING.MAX_FILE_SIZE) {
        return { 
          isValid: false, 
          error: `File size exceeds ${constants.IMAGE_PROCESSING.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
        };
      }

      const metadata = await sharp(buffer).metadata();
      const mimeType = metadata.format ? `image/${metadata.format}` : '';

      if (!constants.IMAGE_PROCESSING.ALLOWED_TYPES.includes(mimeType)) {
        return { 
          isValid: false, 
          error: `File type ${mimeType} not allowed. Allowed types: ${constants.IMAGE_PROCESSING.ALLOWED_TYPES.join(", ")}` 
        };
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: "Invalid image file format" 
      };
    }
  }

  private generateWebPFileName(originalName: string): string {
    return originalName.replace(/\.[^/.]+$/, "") + ".webp";
  }
}

export default new ImageProcessingService(); 