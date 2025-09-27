'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileDropzone } from '@/components/FileDropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface FileManagerProps {
  courseId?: string;
  moduleId?: string;
  maxFiles?: number;
  allowedTypes?: string[];
  onFileSelect?: (file: any) => void;
}

export function FileManager({
  courseId,
  moduleId,
  maxFiles = 10,
  allowedTypes,
  onFileSelect,
}: FileManagerProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  // Fetch files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['files', courseId, moduleId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (moduleId) params.set('moduleId', moduleId);

      const response = await fetch(`/api/files?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({
          courseId,
          moduleId,
        }));

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();
        results.push(result.file);
      }

      return results;
    },
    onSuccess: (uploadedFiles) => {
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }
    },
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles(files);
  }, []);

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  const getFileIcon = (contentType: string) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    if (contentType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    if (contentType.startsWith('video/')) return <Video className="h-8 w-8 text-green-500" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    if (contentType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">File Manager</h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage course materials and resources
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Select files to upload. Supported formats: Images, Videos, PDFs, Documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                maxFiles={maxFiles}
                acceptedTypes={allowedTypes}
                isUploading={uploadMutation.isPending}
                uploadProgress={uploadProgress}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Files Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>
            {filesData?.files?.length || 0} files uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : filesData?.files?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Click "Upload Files" to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filesData.files.map((file: any) => (
                <Card key={file.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.contentType)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{file.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">{file.uploader}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(file.uploadedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name;
                              link.click();
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
