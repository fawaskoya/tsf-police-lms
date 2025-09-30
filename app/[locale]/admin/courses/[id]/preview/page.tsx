'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseStatus, CourseModality } from '@prisma/client';
import { ArrowLeft, Users, BookOpen, FileText, Play, Download, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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

type Module = {
  id: string;
  order: number;
  kind: string;
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
};

export default function CoursePreviewPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // Fetch course data
  const { data: courseData, isLoading: courseLoading } = useQuery({
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
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
        return '📄';
      case 'DOC':
        return '📝';
      case 'XLS':
        return '📊';
      case 'PPT':
        return '📋';
      case 'MP3':
        return '🎵';
      case 'MP4':
        return '🎥';
      case 'IMAGE':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getModuleIcon = (kind: string) => {
    switch (kind) {
      case 'VIDEO':
        return <Play className="h-4 w-4" />;
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      case 'QUIZ':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const course: Course = courseData?.course;
  const modules: Module[] = modulesData?.modules || [];
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
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Course Preview
            </h1>
            <p className="text-muted-foreground">
              {course?.titleAr} - {course?.titleEn}
            </p>
          </div>
        </div>
        <Badge variant={course?.status === 'PUBLISHED' ? 'success' : 'secondary'}>
          {course?.status}
        </Badge>
      </div>

      {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Course Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{course?.titleAr}</h3>
              <p className="text-muted-foreground">{course?.titleEn}</p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">Code:</span>
                <Badge variant="outline">{course?.code}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Enrollments: {course?._count.enrollments}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">Modules: {course?._count.modules}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Files: {course?._count.files}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Duration:</span> {formatDuration(course?.durationMins || 0)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Modality:</span> {course?.modality}
              </div>
              <div className="text-sm">
                <span className="font-medium">Created:</span> {formatDate(course?.createdAt || '')}
              </div>
            </div>
          </div>

          {(course?.summaryAr || course?.summaryEn) && (
            <div className="mt-6 space-y-4">
              {course.summaryAr && (
                <div>
                  <h4 className="font-medium mb-2">Summary (Arabic)</h4>
                  <p className="text-sm text-muted-foreground">{course.summaryAr}</p>
                </div>
              )}
              {course.summaryEn && (
                <div>
                  <h4 className="font-medium mb-2">Summary (English)</h4>
                  <p className="text-sm text-muted-foreground">{course.summaryEn}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Content */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">
            <BookOpen className="mr-2 h-4 w-4" />
            Modules ({modules.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="mr-2 h-4 w-4" />
            Files ({files.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Learning content and activities for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No modules found for this course
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getModuleIcon(module.kind)}
                        <span className="text-sm text-muted-foreground">{module.kind}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{module.metadata.titleAr}</h4>
                        <p className="text-sm text-muted-foreground">{module.metadata.titleEn}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(module.durationMins)}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Files</CardTitle>
              <CardDescription>
                Documents, media, and resources for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No files found for this course
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-2xl">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{file.filename}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{file.fileType}</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.downloadCount} downloads</span>
                          <span>by {file.uploader.firstName} {file.uploader.lastName}</span>
                          {file.isPublic && (
                            <Badge variant="outline" className="text-xs">Public</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
