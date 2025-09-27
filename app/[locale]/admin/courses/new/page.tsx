'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { CourseModality } from '@prisma/client';

const STEPS = [
  { id: 1, title: 'Course Metadata', description: 'Basic course information' },
  { id: 2, title: 'Modules', description: 'Add learning modules' },
  { id: 3, title: 'Settings', description: 'Publish and enrollment settings' },
];

export default function NewCoursePage() {
  const t = useTranslations();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
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
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/courses');
      } else {
        console.error('Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <MetadataStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <ModulesStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <SettingsStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('courses.newCourse')}
          </h1>
          <p className="text-muted-foreground">
            Create a new training course
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="w-full" />

            <div className="flex items-center space-x-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
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
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Create Course
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">{t('courses.courseCode')} *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="TSF-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modality">{t('courses.modality')} *</Label>
          <Select
            value={formData.modality}
            onValueChange={(value) => setFormData({ ...formData, modality: value })}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="titleAr">{t('courses.titleAr')} *</Label>
        <Input
          id="titleAr"
          value={formData.titleAr}
          onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
          placeholder="عنوان الدورة بالعربية"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="titleEn">{t('courses.titleEn')} *</Label>
        <Input
          id="titleEn"
          value={formData.titleEn}
          onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
          placeholder="Course title in English"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summaryAr">{t('courses.summaryAr')}</Label>
        <Textarea
          id="summaryAr"
          value={formData.summaryAr}
          onChange={(e) => setFormData({ ...formData, summaryAr: e.target.value })}
          placeholder="ملخص الدورة بالعربية"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summaryEn">{t('courses.summaryEn')}</Label>
        <Textarea
          id="summaryEn"
          value={formData.summaryEn}
          onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
          placeholder="Course summary in English"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes) *</Label>
        <Input
          id="duration"
          type="number"
          value={formData.durationMins}
          onChange={(e) => setFormData({ ...formData, durationMins: parseInt(e.target.value) || 0 })}
          min="1"
          required
        />
      </div>
    </div>
  );
}

function ModulesStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const [newModule, setNewModule] = useState({
    kind: 'VIDEO',
    uri: '',
    durationMins: 30,
    title: '',
  });

  const addModule = () => {
    if (newModule.uri && newModule.title) {
      setFormData({
        ...formData,
        modules: [...formData.modules, { ...newModule, order: formData.modules.length + 1 }],
      });
      setNewModule({ kind: 'VIDEO', uri: '', durationMins: 30, title: '' });
    }
  };

  const removeModule = (index: number) => {
    const updatedModules = formData.modules.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, modules: updatedModules });
  };

  return (
    <div className="space-y-6">
      {/* Add Module Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Module Type</Label>
              <Select
                value={newModule.kind}
                onValueChange={(value) => setNewModule({ ...newModule, kind: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="H5P">H5P Interactive</SelectItem>
                  <SelectItem value="SCORM">SCORM</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                placeholder="Module title"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={newModule.durationMins}
                onChange={(e) => setNewModule({ ...newModule, durationMins: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content URI/Path</Label>
            <Input
              value={newModule.uri}
              onChange={(e) => setNewModule({ ...newModule, uri: e.target.value })}
              placeholder="/content/video.mp4 or URL"
            />
          </div>
          <Button onClick={addModule} disabled={!newModule.uri || !newModule.title}>
            Add Module
          </Button>
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Course Modules ({formData.modules.length})</h3>
        {formData.modules.length === 0 ? (
          <p className="text-muted-foreground">No modules added yet.</p>
        ) : (
          <div className="space-y-2">
            {formData.modules.map((module: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{module.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {module.kind} • {module.durationMins} min • {module.uri}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeModule(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
          <CardDescription>
            Configure how the course will be published and accessed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoEnroll"
              checked={formData.autoEnroll}
              onChange={(e) => setFormData({ ...formData, autoEnroll: e.target.checked })}
            />
            <Label htmlFor="autoEnroll">Auto-enroll users based on unit/role</Label>
          </div>

          {formData.autoEnroll && (
            <div className="space-y-2">
              <Label>Target Units</Label>
              <Input
                placeholder="Enter unit names separated by commas"
                value={formData.targetUnits.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  targetUnits: e.target.value.split(',').map((u: string) => u.trim()).filter(Boolean)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Users from these units will be automatically enrolled when the course is published
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Code:</span> {formData.code}
            </div>
            <div>
              <span className="font-medium">Modality:</span> {formData.modality}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {formData.durationMins} minutes
            </div>
            <div>
              <span className="font-medium">Modules:</span> {formData.modules.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
