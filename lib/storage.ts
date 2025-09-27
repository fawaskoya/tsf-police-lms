import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '@/lib/logger';

// Cloudflare R2 configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'tsf-police-lms';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export interface FileMetadata {
  bucket: string;
  key: string;
  size: number;
  checksum: string;
  contentType: string;
  url: string;
  signedUrl?: string;
}

export class FileStorageService {
  static async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    uploaderId: string
  ): Promise<FileMetadata> {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const key = `uploads/${uploaderId}/${timestamp}-${randomId}-${fileName}`;

      // Calculate checksum
      const checksum = createHash('sha256').update(file).digest('hex');

      if (IS_PRODUCTION) {
        // Upload to Cloudflare R2
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: {
            uploaderId,
            checksum,
          },
        });

        await s3Client.send(command);

        logger.info('File uploaded to Cloudflare R2', {
          key,
          size: file.length,
          contentType,
          uploaderId,
        });

        // Generate signed URL for secure access
        const signedUrl = await this.generateSignedUrl(key, 7 * 24 * 60 * 60); // 7 days

        return {
          bucket: BUCKET_NAME,
          key,
          size: file.length,
          checksum,
          contentType,
          url: `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`,
          signedUrl,
        };
      } else {
        // Save to local filesystem for development
        await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
        const filePath = path.join(LOCAL_UPLOAD_DIR, `${timestamp}-${randomId}-${fileName}`);
        await fs.writeFile(filePath, file);

        logger.info('File saved locally', {
          path: filePath,
          size: file.length,
          contentType,
          uploaderId,
        });

        return {
          bucket: 'local',
          key: path.relative(process.cwd(), filePath),
          size: file.length,
          checksum,
          contentType,
          url: `/api/files/${path.basename(filePath)}`,
        };
      }
    } catch (error) {
      logger.error('File upload failed', {
        fileName,
        contentType,
        uploaderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async deleteFile(key: string): Promise<void> {
    try {
      if (IS_PRODUCTION) {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        await s3Client.send(command);

        logger.info('File deleted from Cloudflare R2', { key });
      } else {
        // Delete from local filesystem
        const filePath = path.join(process.cwd(), key);
        await fs.unlink(filePath);

        logger.info('File deleted locally', { path: filePath });
      }
    } catch (error) {
      logger.error('File deletion failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!IS_PRODUCTION) {
      // For local development, return direct URL
      return `/api/files/${path.basename(key)}`;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  }

  static async getFileStream(key: string) {
    if (IS_PRODUCTION) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      return response.Body;
    } else {
      const filePath = path.join(process.cwd(), key);
      return fs.readFile(filePath);
    }
  }

  static async validateFile(file: Buffer, maxSize: number = 50 * 1024 * 1024): Promise<void> {
    // Check file size
    if (file.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check for malicious content (basic check)
    const magicBytes = file.subarray(0, 4);
    const blockedSignatures = [
      Buffer.from([0x4D, 0x5A]), // MZ (Windows executable)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
      Buffer.from([0x23, 0x21]), // #! (script files)
    ];

    for (const signature of blockedSignatures) {
      if (magicBytes.equals(signature)) {
        throw new Error('File type not allowed');
      }
    }
  }

  static getAllowedFileTypes(): Record<string, string[]> {
    return {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'text/plain': ['.txt'],
    };
  }
}
