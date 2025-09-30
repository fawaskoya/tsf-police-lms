'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CourseStatus, CourseModality } from '@prisma/client';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Play } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  };
};

export default function CoursesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: 'code',
      header: t('courses.courseCode'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'titleAr',
      header: t('courses.titleAr'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titleAr}</div>
          <div className="text-sm text-muted-foreground">{row.original.titleEn}</div>
        </div>
      ),
    },
    {
      accessorKey: 'modality',
      header: t('courses.modality'),
      cell: ({ row }) => {
        const modality = row.getValue('modality') as CourseModality;
        const modalityLabels = {
          ELearning: t('courses.elearning'),
          Classroom: t('courses.classroom'),
          Blended: t('courses.blended'),
        };
        return <Badge variant="outline">{modalityLabels[modality]}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: t('courses.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as CourseStatus;
        const statusLabels = {
          DRAFT: t('courses.draft'),
          PUBLISHED: t('courses.published'),
          ARCHIVED: t('courses.archived'),
        };
        const statusVariants = {
          DRAFT: 'secondary',
          PUBLISHED: 'success',
          ARCHIVED: 'outline',
        } as const;
        return (
          <Badge variant={statusVariants[status]}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'durationMins',
      header: t('courses.duration'),
      cell: ({ row }) => formatDuration(row.getValue('durationMins')),
    },
    {
      id: 'enrollments',
      header: t('courses.enrollments'),
      cell: ({ row }) => (
        <div className="text-center">{row.original._count.enrollments}</div>
      ),
    },
    {
      id: 'modules',
      header: t('courses.modules'),
      cell: ({ row }) => (
        <div className="text-center">{row.original._count.modules}</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('courses.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const course = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedCourse(course)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/editor`)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/preview`)}>
                <Play className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('courses.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage training courses and learning content
          </p>
        </div>
        <Button onClick={() => router.push('/admin/courses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('courses.newCourse')}
        </Button>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            A list of all training courses in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={coursesData?.courses || []}
            searchKey="titleAr"
            searchPlaceholder="Search courses..."
          />
        </CardContent>
      </Card>

      {/* Course Details Dialog */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCourse.titleAr}</DialogTitle>
              <DialogDescription>
                {selectedCourse.titleEn}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course Code</label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Modality</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourse.modality === 'ELearning' && t('courses.elearning')}
                    {selectedCourse.modality === 'Classroom' && t('courses.classroom')}
                    {selectedCourse.modality === 'Blended' && t('courses.blended')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-muted-foreground">{formatDuration(selectedCourse.durationMins)}</p>
                </div>
              </div>
              {selectedCourse.summaryAr && (
                <div>
                  <label className="text-sm font-medium">Summary (Arabic)</label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.summaryAr}</p>
                </div>
              )}
              {selectedCourse.summaryEn && (
                <div>
                  <label className="text-sm font-medium">Summary (English)</label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.summaryEn}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
