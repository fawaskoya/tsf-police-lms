import { createHash } from 'crypto';
import { extname } from 'path';

export const SUPPORTED_FILE_TYPES = {
  PDF: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  PPT: {
    extensions: ['.ppt', '.pptx'],
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  DOC: {
    extensions: ['.doc', '.docx'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  XLS: {
    extensions: ['.xls', '.xlsx'],
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  MP3: {
    extensions: ['.mp3'],
    mimeTypes: ['audio/mpeg'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  MP4: {
    extensions: ['.mp4'],
    mimeTypes: ['video/mp4'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

export interface FileValidationResult {
  isValid: boolean;
  fileType: SupportedFileType | null;
  error?: string;
}

export function validateFile(
  filename: string,
  mimeType: string,
  size: number
): FileValidationResult {
  const extension = extname(filename).toLowerCase();
  
  // Check file type
  for (const [type, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (
      config.extensions.includes(extension) &&
      config.mimeTypes.includes(mimeType)
    ) {
      // Check file size
      if (size > config.maxSize) {
        return {
          isValid: false,
          fileType: type as SupportedFileType,
          error: `File size exceeds maximum allowed size of ${formatFileSize(config.maxSize)}`,
        };
      }
      
      return {
        isValid: true,
        fileType: type as SupportedFileType,
      };
    }
  }
  
  return {
    isValid: false,
    fileType: null,
    error: 'Unsupported file type. Supported formats: PDF, PPT, DOC, XLS, MP3, MP4, and common image formats.',
  };
}

export function generateFileKey(
  filename: string,
  uploaderId: string,
  courseId?: string,
  moduleId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = extname(filename);
  const baseName = filename.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
  
  let path = `uploads/${uploaderId}/${timestamp}_${random}_${baseName}${extension}`;
  
  if (courseId) {
    path = `uploads/courses/${courseId}/${path}`;
  }
  
  if (moduleId) {
    path = `uploads/modules/${moduleId}/${path}`;
  }
  
  return path;
}

export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: SupportedFileType): string {
  const icons = {
    PDF: '📄',
    PPT: '📊',
    DOC: '📝',
    XLS: '📈',
    MP3: '🎵',
    MP4: '🎬',
    IMAGE: '🖼️',
    OTHER: '📎',
  };
  
  return icons[fileType] || icons.OTHER;
}

export function getFileTypeLabel(fileType: SupportedFileType): string {
  const labels = {
    PDF: 'PDF Document',
    PPT: 'PowerPoint Presentation',
    DOC: 'Word Document',
    XLS: 'Excel Spreadsheet',
    MP3: 'Audio File',
    MP4: 'Video File',
    IMAGE: 'Image',
    OTHER: 'Other',
  };
  
  return labels[fileType] || labels.OTHER;
}

// File processing utilities
export async function processVideoFile(buffer: Buffer): Promise<{ duration?: number; dimensions?: { width: number; height: number } }> {
  // This would integrate with ffprobe or similar tools
  // For now, return basic metadata
  return {
    duration: undefined,
    dimensions: undefined,
  };
}

export async function processAudioFile(buffer: Buffer): Promise<{ duration?: number; bitrate?: number }> {
  // This would integrate with ffprobe or similar tools
  // For now, return basic metadata
  return {
    duration: undefined,
    bitrate: undefined,
  };
}

export async function processImageFile(buffer: Buffer): Promise<{ width?: number; height?: number; format?: string }> {
  // This would integrate with sharp or similar tools
  // For now, return basic metadata
  return {
    width: undefined,
    height: undefined,
    format: undefined,
  };
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}
