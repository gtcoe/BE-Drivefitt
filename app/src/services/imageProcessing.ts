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
    quality: 80,
    width: 1920,
    height: 1080,
    maintainAspectRatio: true,
  };

  async convertSvgToWebP(
    buffer: Buffer,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };

      const originalSize = buffer.length;
      
      let sharpInstance = sharp(buffer, {
        density: 300
      });

      const metadata = await sharpInstance.metadata();
      
      if (finalOptions.maintainAspectRatio) {
        sharpInstance = sharpInstance.resize(
          finalOptions.width,
          finalOptions.height,
          {
            fit: 'inside',
            withoutEnlargement: true
          }
        );
      } else {
        sharpInstance = sharpInstance.resize(
          finalOptions.width,
          finalOptions.height
        );
      }

      const convertedBuffer = await sharpInstance
        .webp({
          quality: finalOptions.quality,
          effort: 6,
          lossless: false
        })
        .toBuffer();

      const convertedMetadata = await sharp(convertedBuffer).metadata();
      const convertedSize = convertedBuffer.length;
      const compressionRatio = Number(((originalSize - convertedSize) / originalSize * 100).toFixed(2));

      logger.info(`SVG to WebP conversion successful. Original: ${originalSize} bytes, Converted: ${convertedSize} bytes, Compression: ${compressionRatio}%`);

      return {
        success: true,
        buffer: convertedBuffer,
        metadata: {
          originalFormat: metadata.format || 'svg',
          originalSize,
          convertedSize,
          compressionRatio,
          width: convertedMetadata.width || 0,
          height: convertedMetadata.height || 0,
        }
      };

    } catch (error) {
      logger.error("SVG to WebP conversion error:", error);
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
  ): Promise<ConversionResult & { processedFile?: Express.Multer.File }> {
    try {
      const isSvg = this.isSvgFile(buffer, originalName);
      
      if (!isSvg) {
        return {
          success: false,
          error: "File is not a valid SVG format"
        };
      }

      const conversionResult = await this.convertSvgToWebP(buffer, options);
      
      if (!conversionResult.success || !conversionResult.buffer) {
        return conversionResult;
      }

      const webpFileName = this.generateWebPFileName(originalName);
      
      const processedFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: webpFileName,
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: conversionResult.buffer,
        size: conversionResult.buffer.length,
        destination: '',
        filename: webpFileName,
        path: '',
        stream: {} as any
      };

      return {
        ...conversionResult,
        processedFile
      };

    } catch (error) {
      logger.error("Image processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown processing error"
      };
    }
  }

  private isSvgFile(buffer: Buffer, originalName: string): boolean {
    const isSvgExtension = originalName.toLowerCase().endsWith('.svg');
    const hasSvgHeader = buffer.toString('utf8', 0, 100).includes('<svg');
    
    return isSvgExtension && hasSvgHeader;
  }

  private generateWebPFileName(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}.webp`;
  }

  validateSvgFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: "No file provided" };
    }

    if (file.size > constants.SVG_PROCESSING.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File size exceeds ${constants.SVG_PROCESSING.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
      };
    }

    if (!constants.SVG_PROCESSING.ALLOWED_TYPES.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: `File type ${file.mimetype} not allowed. Only SVG files are supported.` 
      };
    }

    const isSvg = this.isSvgFile(file.buffer, file.originalname);
    if (!isSvg) {
      return {
        isValid: false,
        error: "File is not a valid SVG format"
      };
    }

    return { isValid: true };
  }
}

export default new ImageProcessingService(); 