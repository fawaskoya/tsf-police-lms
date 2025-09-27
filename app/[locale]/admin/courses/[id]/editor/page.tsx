'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Save, Loader2 } from 'lucide-react';
import { CourseModality, CourseStatus } from '@prisma/client';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Course Metadata', description: 'Basic course information' },
  { id: 2, title: 'Modules', description: 'Edit learning modules' },
  { id: 3, title: 'Settings', description: 'Publish and enrollment settings' },
];

type CourseData = {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  modality: CourseModality;
  durationMins: number;
  status: CourseStatus;
  version: string;
  _count: {
    enrollments: number;
    modules: number;
  };
};

export default function EditCoursePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Metadata
    code: '',
    titleAr: '',
    titleEn: '',
    summaryAr: '',
    summaryEn: '',
    modality: 'ELearning' as CourseModality,
    durationMins: 60,

    // Step 2: Modules
    modules: [] as any[],

    // Step 3: Settings
    autoEnroll: false,
    targetUnits: [] as string[],
    status: 'DRAFT' as CourseStatus,
  });

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
    enabled: !!courseId,
  });

  // Load course data when available
  useEffect(() => {
    if (courseData?.course) {
      const course = courseData.course;
      setFormData({
        code: course.code || '',
        titleAr: course.titleAr || '',
        titleEn: course.titleEn || '',
        summaryAr: course.summaryAr || '',
        summaryEn: course.summaryEn || '',
        modality: course.modality || 'ELearning',
        durationMins: course.durationMins || 60,
        modules: [], // Will load modules separately
        autoEnroll: false,
        targetUnits: [],
        status: course.status || 'DRAFT',
      });
    }
  }, [courseData]);

  const progress = (currentStep / STEPS.length) * 100;

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          titleAr: formData.titleAr,
          titleEn: formData.titleEn,
          summaryAr: formData.summaryAr,
          summaryEn: formData.summaryEn,
          modality: formData.modality,
          durationMins: formData.durationMins,
          status: formData.status,
        }),
      });

      if (response.ok) {
        toast.success('Course updated successfully');
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        router.push('/admin/courses');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
          <p className="text-muted-foreground">
            Update course information and settings
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Step {currentStep} of {STEPS.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step.id <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., POL-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modality">Modality *</Label>
                  <Select
                    value={formData.modality}
                    onValueChange={(value: CourseModality) =>
                      setFormData({ ...formData, modality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELearning">E-Learning</SelectItem>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Blended">Blended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleAr">Title (Arabic) *</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="دورة تدريبية في..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleEn">Title (English) *</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Training Course in..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMins">Duration (minutes) *</Label>
                  <Input
                    id="durationMins"
                    type="number"
                    value={formData.durationMins}
                    onChange={(e) => setFormData({ ...formData, durationMins: parseInt(e.target.value) || 60 })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: CourseStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summaryAr">Summary (Arabic)</Label>
                <Textarea
                  id="summaryAr"
                  value={formData.summaryAr}
                  onChange={(e) => setFormData({ ...formData, summaryAr: e.target.value })}
                  placeholder="وصف مختصر للدورة..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summaryEn">Summary (English)</Label>
                <Textarea
                  id="summaryEn"
                  value={formData.summaryEn}
                  onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
                  placeholder="Brief course description..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Module management will be implemented here</p>
                <p className="text-sm">This allows adding/editing course modules and content</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced settings will be implemented here</p>
                <p className="text-sm">Auto-enrollment, target units, prerequisites, etc.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/courses')}>
            Cancel
          </Button>

          {currentStep === STEPS.length ? (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Update Course
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
