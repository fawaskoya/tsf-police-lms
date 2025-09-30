'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
} from 'lucide-react';
import { formatFileSize, getFileIcon, getFileTypeLabel } from '@/lib/fileUpload';

interface FileUploadProps {
  courseId?: string;
  moduleId?: string;
  isPublic?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  fileType: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
  error?: string;
  url?: string;
}

export function FileUpload({
  courseId,
  moduleId,
  isPublic = false,
  maxFiles = 10,
  acceptedTypes,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    // Initialize file objects
    acceptedFiles.forEach(file => {
      newFiles.push({
        id: Math.random().toString(36).substring(7),
        filename: file.name,
        size: file.size,
        fileType: getFileTypeFromMime(file.type),
        status: 'uploading',
        progress: 0,
      });
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Upload files
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileObj = newFiles[i];

      try {
        await uploadFile(file, fileObj.id);
      } catch (error) {
        console.error('Upload error:', error);
        updateFileStatus(fileObj.id, 'error', undefined, error instanceof Error ? error.message : 'Upload failed');
      }
    }

    setUploading(false);
  }, [courseId, moduleId, isPublic]);

  const uploadFile = async (file: File, fileId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      courseId,
      moduleId,
      isPublic,
    }));

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded * 100) / event.total);
        updateFileProgress(fileId, progress);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          updateFileStatus(fileId, 'uploaded', 100, undefined, response.data);
        } else {
          updateFileStatus(fileId, 'error', undefined, response.error);
        }
      } else {
        const error = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Upload failed';
        updateFileStatus(fileId, 'error', undefined, error);
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      updateFileStatus(fileId, 'error', undefined, 'Network error');
    });

    xhr.open('POST', '/api/files/upload');
    xhr.send(formData);
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === fileId ? { ...file, progress } : file
      )
    );
  };

  const updateFileStatus = (
    fileId: string,
    status: 'uploading' | 'uploaded' | 'error',
    progress?: number,
    error?: string,
    data?: any
  ) => {
    setFiles(prev =>
      prev.map(file =>
        file.id === fileId
          ? { ...file, status, progress, error, url: data?.url }
          : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const downloadFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file?.url) return;

    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedTypes ? {
      [acceptedTypes[0]]: acceptedTypes,
    } : {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'audio/mpeg': ['.mp3'],
      'video/mp4': ['.mp4'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
  });

  const getFileTypeFromMime = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
    if (mimeType.includes('audio')) return 'MP3';
    if (mimeType.includes('video')) return 'MP4';
    if (mimeType.includes('image')) return 'IMAGE';
    return 'OTHER';
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, PPT, DOC, XLS, MP3, MP4, and images
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map(file => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(file.fileType as any)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{file.filename}</p>
                        <Badge variant="secondary">
                          {getFileTypeLabel(file.fileType as any)}
                        </Badge>
                        <Badge variant="outline">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-sm text-muted-foreground mt-1">
                            Uploading... {file.progress}%
                          </p>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{file.error}</AlertDescription>
                        </Alert>
                      )}
                      {file.status === 'uploaded' && (
                        <div className="flex items-center space-x-2 mt-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploaded' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(file.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
