import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import constants from "../config/constants/drivefitt-constants";
import { logger } from "../logging";
import crypto from "crypto";
import path from "path";

class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl: string;

  constructor() {
    this.s3Client = new S3Client({
      region: constants.S3.REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    this.bucketName = constants.S3.BUCKET_NAME;
    this.cdnUrl = constants.S3.CDN_URL;
  }

  private generateFileName(originalName: string, uploadPath: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    
    return `${uploadPath}${timestamp}_${randomString}_${sanitizedName}${extension}`;
  }

  private validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: "No file provided" };
    }

    if (file.size > constants.S3.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File size exceeds ${constants.S3.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
      };
    }

    if (!constants.S3.ALLOWED_TYPES.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: `File type ${file.mimetype} not allowed. Allowed types: ${constants.S3.ALLOWED_TYPES.join(", ")}` 
      };
    }

    return { isValid: true };
  }

  async uploadFile(
    file: Express.Multer.File, 
    uploadPath: keyof typeof constants.S3.UPLOAD_PATHS = "GENERAL"
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const pathPrefix = constants.S3.UPLOAD_PATHS[uploadPath];
      const fileName = this.generateFileName(file.originalname, pathPrefix);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "max-age=31536000", // 1 year
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      const fileUrl = this.cdnUrl 
        ? `${this.cdnUrl}/${fileName}`
        : `https://${this.bucketName}.s3.${constants.S3.REGION}.amazonaws.com/${fileName}`;

      logger.info(`File uploaded successfully: ${fileName}`);
      
      return { 
        success: true, 
        url: fileUrl 
      };

    } catch (error) {
      logger.error("S3 upload error:", error);
      return { 
        success: false, 
        error: "Failed to upload file to S3" 
      };
    }
  }

  async deleteFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      let fileName: string;
      
      if (this.cdnUrl && fileUrl.startsWith(this.cdnUrl)) {
        fileName = fileUrl.replace(`${this.cdnUrl}/`, "");
      } else {
        const urlParts = fileUrl.split("/");
        fileName = urlParts[urlParts.length - 1];
      }

      const deleteParams = {
        Bucket: this.bucketName,
        Key: fileName,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);

      logger.info(`File deleted successfully: ${fileName}`);
      
      return { success: true };

    } catch (error) {
      logger.error("S3 delete error:", error);
      return { 
        success: false, 
        error: "Failed to delete file from S3" 
      };
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[], 
    uploadPath: keyof typeof constants.S3.UPLOAD_PATHS = "GENERAL"
  ): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> {
    const results = await Promise.allSettled(
      files.map(file => this.uploadFile(file, uploadPath))
    );

    const urls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        urls.push(result.value.url!);
      } else {
        const error = result.status === "fulfilled" 
          ? result.value.error 
          : `Failed to upload ${files[index].originalname}`;
        errors.push(error || "Unknown error");
      }
    });

    return {
      success: urls.length > 0,
      urls: urls.length > 0 ? urls : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export default new S3UploadService(); 