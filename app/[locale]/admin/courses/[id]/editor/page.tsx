'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CourseStatus, CourseModality } from '@prisma/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Eye,
  Download,
  Settings,
  BookOpen,
  Video,
  File,
  HelpCircle,
  Users
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ModuleManager } from '@/components/ModuleManager';
import { formatDate } from '@/lib/utils';

type Course = {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  status: CourseStatus;
  version: string;
  modality: CourseModality;
  durationMins: number;
  createdById: string;
  createdAt: string;
  _count: {
    enrollments: number;
    modules: number;
    files: number;
  };
};

type CourseModule = {
  id: string;
  order: number;
  kind: 'VIDEO' | 'PDF' | 'QUIZ' | 'SCORM' | 'H5P';
  uri: string;
  durationMins: number;
  metadata: {
    titleAr: string;
    titleEn: string;
  };
};

type FileObject = {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  contentType: string;
  downloadCount: number;
  isPublic: boolean;
  metadata: any;
  uploader: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
};

export default function CourseEditorPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const [formData, setFormData] = useState({
    code: '',
    titleAr: '',
    titleEn: '',
    summaryAr: '',
    summaryEn: '',
    modality: 'ELearning' as CourseModality,
    durationMins: 60,
    status: 'DRAFT' as CourseStatus,
  });

  const [activeTab, setActiveTab] = useState('basic');

  // Fetch course data
  const { data: courseData, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
  });

  // Fetch course modules
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
  });

  // Fetch course files
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ['course-files', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/files?courseId=${courseId}&limit=50`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });

  // Update form data when course data is loaded
  useEffect(() => {
    if (courseData?.course) {
      const course = courseData.course;
      setFormData({
        code: course.code,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        summaryAr: course.summaryAr || '',
        summaryEn: course.summaryEn || '',
        modality: course.modality,
        durationMins: course.durationMins,
        status: course.status,
      });
    }
  }, [courseData]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh the courses list and current course data
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (error) => {
      console.error('Error updating course:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourseMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      case 'DOC':
        return <FileText className="h-4 w-4" />;
      case 'XLS':
        return <FileText className="h-4 w-4" />;
      case 'PPT':
        return <FileText className="h-4 w-4" />;
      case 'MP3':
        return <File className="h-4 w-4" />;
      case 'MP4':
        return <Video className="h-4 w-4" />;
      case 'IMAGE':
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
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

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading course: {(courseError as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const course: Course = courseData?.course;
  const modules: CourseModule[] = modulesData?.modules || [];
  const files: FileObject[] = filesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('courses.editCourse')}
            </h1>
            <p className="text-muted-foreground">
              {course?.titleAr} - {course?.titleEn}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={course?.status === 'PUBLISHED' ? 'success' : 'secondary'}>
            {course?.status}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/courses/${courseId}/preview`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t('courses.preview')}
          </Button>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('courses.modules')}</p>
                <p className="text-2xl font-bold">{course?._count.modules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('courses.files')}</p>
                <p className="text-2xl font-bold">{course?._count.files}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold">{formatDuration(course?.durationMins || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('courses.enrollments')}</p>
                <p className="text-2xl font-bold">{course?._count.enrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">{t('courses.basicInfo')}</TabsTrigger>
          <TabsTrigger value="modules">{t('courses.modules')} ({modules.length})</TabsTrigger>
          <TabsTrigger value="files">{t('courses.files')} ({files.length})</TabsTrigger>
          <TabsTrigger value="settings">{t('courses.settings')}</TabsTrigger>
          <TabsTrigger value="preview">{t('courses.preview')}</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('courses.basicInfo')}</CardTitle>
              <CardDescription>
                {t('courses.basicInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Code */}
                  <div className="space-y-2">
                    <Label htmlFor="code">{t('courses.courseCode')}</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="e.g., POL-101"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="durationMins">{t('courses.duration')}</Label>
                    <Input
                      id="durationMins"
                      type="number"
                      value={formData.durationMins}
                      onChange={(e) => handleInputChange('durationMins', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>

                  {/* Arabic Title */}
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">{t('courses.titleAr')}</Label>
                    <Input
                      id="titleAr"
                      value={formData.titleAr}
                      onChange={(e) => handleInputChange('titleAr', e.target.value)}
                      placeholder="عنوان الدورة بالعربية"
                      required
                    />
                  </div>

                  {/* English Title */}
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">{t('courses.titleEn')}</Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) => handleInputChange('titleEn', e.target.value)}
                      placeholder="Course Title in English"
                      required
                    />
                  </div>

                  {/* Modality */}
                  <div className="space-y-2">
                    <Label htmlFor="modality">{t('courses.modality')}</Label>
                    <Select
                      value={formData.modality}
                      onValueChange={(value) => handleInputChange('modality', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ELearning">{t('courses.elearning')}</SelectItem>
                        <SelectItem value="Classroom">{t('courses.classroom')}</SelectItem>
                        <SelectItem value="Blended">{t('courses.blended')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('courses.status')}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t('courses.draft')}</SelectItem>
                        <SelectItem value="PUBLISHED">{t('courses.published')}</SelectItem>
                        <SelectItem value="ARCHIVED">{t('courses.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Arabic Summary */}
                <div className="space-y-2">
                  <Label htmlFor="summaryAr">{t('courses.summaryAr')}</Label>
                  <Textarea
                    id="summaryAr"
                    value={formData.summaryAr}
                    onChange={(e) => handleInputChange('summaryAr', e.target.value)}
                    placeholder="ملخص الدورة بالعربية"
                    rows={3}
                  />
                </div>

                {/* English Summary */}
                <div className="space-y-2">
                  <Label htmlFor="summaryEn">{t('courses.summaryEn')}</Label>
                  <Textarea
                    id="summaryEn"
                    value={formData.summaryEn}
                    onChange={(e) => handleInputChange('summaryEn', e.target.value)}
                    placeholder="Course summary in English"
                    rows={3}
                  />
                </div>

                {/* Error Display */}
                {updateCourseMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {(updateCourseMutation.error as Error).message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {updateCourseMutation.isSuccess && (
                  <Alert>
                    <AlertDescription>
                      {t('courses.updateSuccess')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCourseMutation.isPending}
                  >
                    {updateCourseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t('common.save')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <ModuleManager 
            courseId={courseId}
            modules={modules}
            onModuleUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
              queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            }}
          />
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('courses.files')}</span>
                <div className="flex items-center space-x-2">
                  <FileUpload courseId={courseId} />
                </div>
              </CardTitle>
              <CardDescription>
                {t('courses.filesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('courses.noFiles')}
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {getFileIcon(file.fileType)}
                        <Badge variant="outline">{file.fileType}</Badge>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{file.filename}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.downloadCount} downloads</span>
                          <span>by {file.uploader.firstName} {file.uploader.lastName}</span>
                          <span>{formatDate(file.createdAt)}</span>
                          {file.isPublic && (
                            <Badge variant="outline" className="text-xs">Public</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              // Fetch file with authentication and open in new tab
                              const previewUrl = `/api/files/${(file as any).key}/preview`;
                              console.log('Opening file preview:', previewUrl);
                              
                              const response = await fetch(previewUrl, {
                                credentials: 'include',
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Preview failed: HTTP ${response.status} ${response.statusText}`);
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              
                              // Clean up the object URL after a delay
                              setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                            } catch (error) {
                              console.error('Preview error:', error);
                              alert(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                          }}
                          title="Preview File"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              console.log('Downloading file:', file);
                              const response = await fetch(`/api/files/${(file as any).key}`, {
                                credentials: 'include',
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Download error:', error);
                              alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Settings/Edit file
                            console.log('Edit file settings:', file);
                            alert(`Edit settings for: ${file.filename}\n(This feature can be expanded)`);
                          }}
                          title="Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
                              try {
                                console.log('Deleting file:', file);
                                const response = await fetch(`/api/files/${(file as any).key}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json().catch(() => ({}));
                                  throw new Error(errorData.error || `Delete failed: HTTP ${response.status} ${response.statusText}`);
                                }
                                
                                const result = await response.json();
                                console.log('Delete result:', result);
                                alert(`File "${file.filename}" deleted successfully!`);
                                
                                // Refresh the files list
                                window.location.reload();
                              } catch (error) {
                                console.error('Delete error:', error);
                                alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              }
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('courses.courseSettings')}</CardTitle>
              <CardDescription>
                {t('courses.settingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('courses.version')}</Label>
                  <Input value={course?.version || '1.0'} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('courses.createdBy')}</Label>
                  <Input value={course?.createdById || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('courses.createdAt')}</Label>
                  <Input value={formatDate(course?.createdAt || '')} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Total Enrollments</Label>
                  <Input value={course?._count.enrollments || 0} disabled />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('courses.dangerZone')}</h3>
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Course</h4>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the course and all its data.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Course
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('courses.preview')}</CardTitle>
              <CardDescription>
                {t('courses.previewDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">{formData.titleAr}</h2>
                  <p className="text-muted-foreground mb-4">{formData.titleEn}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Code: {formData.code}</span>
                    <span>Duration: {formatDuration(formData.durationMins)}</span>
                    <span>Modality: {formData.modality}</span>
                    <Badge variant={formData.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                      {formData.status}
                    </Badge>
                  </div>
                </div>
                
                {(formData.summaryAr || formData.summaryEn) && (
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Summary</h3>
                    {formData.summaryAr && (
                      <div className="mb-3">
                        <h4 className="font-medium mb-1">Arabic</h4>
                        <p className="text-sm text-muted-foreground">{formData.summaryAr}</p>
                      </div>
                    )}
                    {formData.summaryEn && (
                      <div>
                        <h4 className="font-medium mb-1">English</h4>
                        <p className="text-sm text-muted-foreground">{formData.summaryEn}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}