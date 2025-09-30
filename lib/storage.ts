import { promises as fs } from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';

export interface StorageConfig {
  driver: 'local' | 's3' | 'minio';
  bucket?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

export class StorageService {
  private config: StorageConfig;
  private uploadDir: string;

  constructor() {
    this.config = {
      driver: (process.env.STORAGE_DRIVER as any) || 'local',
      bucket: process.env.STORAGE_BUCKET || 'tsf-lms-uploads',
      endpoint: process.env.STORAGE_ENDPOINT,
      accessKey: process.env.STORAGE_ACCESS_KEY,
      secretKey: process.env.STORAGE_SECRET_KEY,
      region: process.env.STORAGE_REGION || 'us-east-1',
    };
    
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<UploadResult> {
    try {
      switch (this.config.driver) {
        case 'local':
          return await this.uploadToLocal(key, buffer);
        case 's3':
        case 'minio':
          return await this.uploadToS3(key, buffer, contentType);
        default:
          throw new Error(`Unsupported storage driver: ${this.config.driver}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  async downloadFile(key: string): Promise<DownloadResult> {
    try {
      switch (this.config.driver) {
        case 'local':
          return await this.downloadFromLocal(key);
        case 's3':
        case 'minio':
          return await this.downloadFromS3(key);
        default:
          throw new Error(`Unsupported storage driver: ${this.config.driver}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown download error',
      };
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      switch (this.config.driver) {
        case 'local':
          return await this.deleteFromLocal(key);
        case 's3':
        case 'minio':
          return await this.deleteFromS3(key);
        default:
          throw new Error(`Unsupported storage driver: ${this.config.driver}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  getFileUrl(key: string): string {
    switch (this.config.driver) {
      case 'local':
        return `/api/files/${key}`;
      case 's3':
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      case 'minio':
        return `${this.config.endpoint}/${this.config.bucket}/${key}`;
      default:
        throw new Error(`Unsupported storage driver: ${this.config.driver}`);
    }
  }

  private async uploadToLocal(key: string, buffer: Buffer): Promise<UploadResult> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const dir = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, buffer);
      
      return {
        success: true,
        key,
        url: this.getFileUrl(key),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local upload failed',
      };
    }
  }

  private async downloadFromLocal(key: string): Promise<DownloadResult> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const buffer = await fs.readFile(filePath);
      
      return {
        success: true,
        buffer,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local download failed',
      };
    }
  }

  private async deleteFromLocal(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, key);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Local delete error:', error);
      return false;
    }
  }

  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    // This would implement S3/MinIO upload
    // For now, fallback to local storage
    console.warn('S3/MinIO upload not implemented, falling back to local storage');
    return await this.uploadToLocal(key, buffer);
  }

  private async downloadFromS3(key: string): Promise<DownloadResult> {
    // This would implement S3/MinIO download
    // For now, fallback to local storage
    console.warn('S3/MinIO download not implemented, falling back to local storage');
    return await this.downloadFromLocal(key);
  }

  private async deleteFromS3(key: string): Promise<boolean> {
    // This would implement S3/MinIO delete
    // For now, fallback to local storage
    console.warn('S3/MinIO delete not implemented, falling back to local storage');
    return await this.deleteFromLocal(key);
  }
}

export const storageService = new StorageService();