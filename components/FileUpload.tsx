'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FileUploadProps {
  courseId?: string;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  courseId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/mpeg',
    'video/mp4',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
}: FileUploadProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) {
        formData.append('metadata', JSON.stringify({ courseId, isPublic: false }));
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    },
    onSuccess: (data, file) => {
      // Update progress
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: 'success', progress: 100 }
            : item
        )
      );

      // Invalidate queries to refresh file lists
      queryClient.invalidateQueries({ queryKey: ['course-files'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error, file) => {
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Initialize upload progress for all files
    const newProgress: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(prev => [...prev, ...newProgress]);
    setIsOpen(true);

    // Upload files sequentially to avoid overwhelming the server
    acceptedFiles.forEach((file, index) => {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => 
          prev.map(item => 
            item.file === file && item.status === 'uploading'
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item
          )
        );
      }, 200);

      // Upload the file
      setTimeout(() => {
        uploadMutation.mutate(file);
        clearInterval(progressInterval);
      }, index * 500); // Stagger uploads by 500ms
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: uploadMutation.isPending
  });

  const removeFile = (file: File) => {
    setUploadProgress(prev => prev.filter(item => item.file !== file));
  };

  const clearCompleted = () => {
    setUploadProgress(prev => prev.filter(item => item.status === 'uploading'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <File className="h-4 w-4 text-green-500" />;
    if (fileType.startsWith('video/')) return <File className="h-4 w-4 text-blue-500" />;
    if (fileType.startsWith('audio/')) return <File className="h-4 w-4 text-purple-500" />;
    if (fileType.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <File className="h-4 w-4 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <File className="h-4 w-4 text-green-600" />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <File className="h-4 w-4 text-orange-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
              ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  {t('files.dragDropFiles')}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('files.supportedFormats')}
                </p>
                <Button variant="outline" disabled={uploadMutation.isPending}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('files.selectFiles')}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              {t('files.maxFileSize')}: {formatFileSize(maxSize)} • {t('files.maxFiles')}: {maxFiles}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{t('files.uploadProgress')}</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCompleted}
                disabled={uploadProgress.some(item => item.status === 'uploading')}
              >
                {t('files.clearCompleted')}
              </Button>
            </div>
            <div className="space-y-3">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileTypeIcon(item.file.type)}
                      <div>
                        <p className="text-sm font-medium">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {item.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(item.file)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  {item.status === 'error' && item.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {item.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}