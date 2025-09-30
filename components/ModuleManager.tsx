'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Settings, 
  Video, 
  FileText, 
  HelpCircle, 
  BookOpen,
  Loader2,
  ArrowUp,
  ArrowDown,
  Upload,
  Link,
  File,
  Copy
} from 'lucide-react';

interface ModuleManagerProps {
  courseId: string;
  modules: Module[];
  onModuleUpdate?: () => void;
}

interface Module {
  id: string;
  order: number;
  kind: 'VIDEO' | 'PDF' | 'QUIZ' | 'SCORM' | 'H5P';
  uri: string;
  durationMins: number;
  metadata: {
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
  };
}

interface ModuleFormData {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  kind: 'VIDEO' | 'PDF' | 'QUIZ' | 'SCORM' | 'H5P';
  uri: string;
  durationMins: number;
}

export function ModuleManager({ courseId, modules, onModuleUpdate }: ModuleManagerProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [contentType, setContentType] = useState<'url' | 'file'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ModuleFormData>({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    kind: 'VIDEO',
    uri: '',
    durationMins: 30,
  });

  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({ courseId, isPublic: false }));

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'File upload failed';
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
    onSuccess: (data) => {
      // Update form data with the uploaded file URI
      const fileUri = data.data.key || data.data.uri;
      setFormData(prev => ({
        ...prev,
        uri: fileUri,
      }));
      setIsUploading(false);
      setUploadProgress(100);
      
      // Clear the uploaded file state after a short delay to show success
      setTimeout(() => {
        setUploadedFile(null);
        setUploadProgress(0);
      }, 2000);
    },
    onError: (error) => {
      console.error('File upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          metadata: {
            titleAr: data.titleAr,
            titleEn: data.titleEn,
            descriptionAr: data.descriptionAr,
            descriptionEn: data.descriptionEn,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create module');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsAddDialogOpen(false);
      resetForm();
      onModuleUpdate?.();
    },
    onError: (error) => {
      console.error('Error creating module:', error);
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: string; data: ModuleFormData }) => {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          metadata: {
            titleAr: data.titleAr,
            titleEn: data.titleEn,
            descriptionAr: data.descriptionAr,
            descriptionEn: data.descriptionEn,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update module');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setEditingModule(null);
      resetForm();
      onModuleUpdate?.();
    },
    onError: (error) => {
      console.error('Error updating module:', error);
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete module');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      onModuleUpdate?.();
    },
    onError: (error) => {
      console.error('Error deleting module:', error);
    },
  });

  const resetForm = () => {
    setFormData({
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
      kind: 'VIDEO',
      uri: '',
      durationMins: 30,
    });
    setContentType('url');
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    // Reset any file input
    const fileInput = document.getElementById('module-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileSelect = (file: File) => {
    // Clear any existing file first
    setUploadedFile(null);
    setUploadProgress(0);
    setFormData(prev => ({ ...prev, uri: '' }));
    
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Upload the file
    fileUploadMutation.mutate(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeFromKind = (kind: string) => {
    switch (kind) {
      case 'VIDEO':
        return 'video/*';
      case 'PDF':
        return 'application/pdf';
      case 'QUIZ':
        return 'application/json';
      case 'SCORM':
        return 'application/zip';
      case 'H5P':
        return 'application/zip';
      default:
        return '*/*';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingModule) {
      updateModuleMutation.mutate({
        moduleId: editingModule.id,
        data: formData,
      });
    } else {
      createModuleMutation.mutate(formData);
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      titleAr: module.metadata.titleAr,
      titleEn: module.metadata.titleEn,
      descriptionAr: module.metadata.descriptionAr || '',
      descriptionEn: module.metadata.descriptionEn || '',
      kind: module.kind,
      uri: module.uri,
      durationMins: module.durationMins,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (moduleId: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const getModuleIcon = (kind: string) => {
    switch (kind) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      case 'QUIZ':
        return <HelpCircle className="h-4 w-4" />;
      case 'SCORM':
        return <BookOpen className="h-4 w-4" />;
      case 'H5P':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Add Module Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{t('courses.modules')}</h3>
          <p className="text-sm text-muted-foreground">
            {modules.length} modules • Total duration: {formatDuration(modules.reduce((sum, m) => sum + m.durationMins, 0))}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('courses.addModule')}
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.map((module, index) => (
          <Card key={module.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-medium">{module.order}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getModuleIcon(module.kind)}
                    <Badge variant="outline">{module.kind}</Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{module.metadata.titleAr}</h4>
                    <p className="text-sm text-muted-foreground">{module.metadata.titleEn}</p>
                    {module.metadata.descriptionAr && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {module.metadata.descriptionAr}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(module.durationMins)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(module)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(module.id)}
                      disabled={deleteModuleMutation.isPending}
                    >
                      {deleteModuleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Module Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? t('courses.editModule') : t('courses.addModule')}
            </DialogTitle>
            <DialogDescription>
              {editingModule 
                ? t('courses.editModuleDescription')
                : t('courses.addModuleDescription')
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arabic Title */}
              <div className="space-y-2">
                <Label htmlFor="titleAr">{t('courses.titleAr')}</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                  placeholder="عنوان الوحدة بالعربية"
                  required
                />
              </div>

              {/* English Title */}
              <div className="space-y-2">
                <Label htmlFor="titleEn">{t('courses.titleEn')}</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                  placeholder="Module Title in English"
                  required
                />
              </div>

              {/* Module Type */}
              <div className="space-y-2">
                <Label htmlFor="kind">{t('courses.moduleType')}</Label>
                <Select
                  value={formData.kind}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, kind: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">{t('courses.video')}</SelectItem>
                    <SelectItem value="PDF">{t('courses.pdf')}</SelectItem>
                    <SelectItem value="QUIZ">{t('courses.quiz')}</SelectItem>
                    <SelectItem value="SCORM">{t('courses.scorm')}</SelectItem>
                    <SelectItem value="H5P">{t('courses.h5p')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="durationMins">{t('courses.duration')}</Label>
                <Input
                  id="durationMins"
                  type="number"
                  value={formData.durationMins}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMins: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>{t('courses.contentType')}</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={contentType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContentType('url')}
                  className="flex items-center space-x-2"
                >
                  <Link className="h-4 w-4" />
                  <span>{t('courses.urlLink')}</span>
                </Button>
                <Button
                  type="button"
                  variant={contentType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContentType('file')}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{t('courses.uploadFile')}</span>
                </Button>
              </div>
            </div>

            {/* Content Input - URL or File Upload */}
            {contentType === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor="uri">{t('courses.moduleUri')}</Label>
                <Input
                  id="uri"
                  value={formData.uri}
                  onChange={(e) => setFormData(prev => ({ ...prev, uri: e.target.value }))}
                  placeholder="/videos/module-intro.mp4 or /docs/manual.pdf"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('courses.uploadModuleFile')}</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 max-h-48 overflow-hidden">
                  <input
                    type="file"
                    accept={getFileTypeFromKind(formData.kind)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="module-file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="module-file-upload"
                    className={`cursor-pointer flex flex-col items-center space-y-2 ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'
                    } transition-colors`}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    {isUploading ? (
                      <div className="text-center">
                        <p className="text-sm font-medium">{t('files.uploading')}...</p>
                        <Progress value={uploadProgress} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                      </div>
                    ) : uploadedFile ? (
                      <div className="text-center space-y-1">
                        <File className="h-5 w-5 text-green-500 mx-auto" />
                        <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                        <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                      </div>
                    ) : formData.uri && contentType === 'file' ? (
                      <div className="text-center space-y-1">
                        <File className="h-5 w-5 text-green-500 mx-auto" />
                        <p className="text-sm font-medium">{t('courses.fileReady')}</p>
                        <p className="text-xs text-green-600">✓ Ready to save module</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium">{t('courses.clickToUpload')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('courses.supportedFormats')}: {getFileTypeFromKind(formData.kind)}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {formData.uri && contentType === 'file' && (
                  <div className="mt-3 p-3 bg-muted/30 rounded border text-xs text-muted-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <File className="h-3 w-3" />
                        <span className="font-medium">{t('courses.uploadedFile')}:</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(formData.uri)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="break-all font-mono text-xs bg-background/50 p-2 rounded border">
                      {formData.uri}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Arabic Description */}
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{t('courses.descriptionAr')}</Label>
              <Textarea
                id="descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                placeholder="وصف الوحدة بالعربية"
                rows={3}
              />
            </div>

            {/* English Description */}
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{t('courses.descriptionEn')}</Label>
              <Textarea
                id="descriptionEn"
                value={formData.descriptionEn}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                placeholder="Module description in English"
                rows={3}
              />
            </div>

            {/* Success Display */}
            {formData.uri && contentType === 'file' && !isUploading && (
              <Alert className="border-green-200 bg-green-50 py-2">
                <AlertDescription className="text-green-800 text-sm">
                  ✓ File uploaded successfully. Ready to save module.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {(createModuleMutation.error || updateModuleMutation.error || fileUploadMutation.error) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(createModuleMutation.error || updateModuleMutation.error || fileUploadMutation.error)?.message}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingModule(null);
                  resetForm();
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  createModuleMutation.isPending || 
                  updateModuleMutation.isPending || 
                  isUploading || 
                  (contentType === 'file' && !formData.uri) ||
                  !formData.titleAr.trim() ||
                  !formData.titleEn.trim() ||
                  !formData.uri.trim()
                }
              >
                {(createModuleMutation.isPending || updateModuleMutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? t('files.uploading') : t('common.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
