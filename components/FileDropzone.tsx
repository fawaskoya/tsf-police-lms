'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FileDropzone({
  onFilesSelected,
  onFileRemove,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.ppt', '.pptx'],
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
}: FileDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })
    );

    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, maxFiles);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [selectedFiles, maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - selectedFiles.length,
    maxSize,
    disabled: disabled || isUploading,
  });

  const removeFile = (fileToRemove: FileWithPreview) => {
    const updatedFiles = selectedFiles.filter(file => file !== fileToRemove);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    onFileRemove?.(fileToRemove);

    // Clean up preview URL
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const getFileIcon = (file: File) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-green-500" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary',
          disabled || isUploading ? 'opacity-50 cursor-not-allowed' : '',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse files
        </p>
        <div className="text-xs text-gray-400">
          <p>Supported formats: Images, Videos, PDFs, Documents</p>
          <p>Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each</p>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {file.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file);
                  }}
                  disabled={isUploading}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
