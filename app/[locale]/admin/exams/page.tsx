'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { QuestionType } from '@prisma/client';

type Exam = {
  id: string;
  titleAr: string;
  titleEn: string;
  courseId: string;
  timeLimitMins: number;
  totalMarks: number;
  randomize: boolean;
  negativeMarking: boolean;
  lockdown: boolean;
  isPublished: boolean;
  _count: {
    questions: number;
    attempts: number;
  };
};

type Question = {
  id: string;
  examId: string;
  type: QuestionType;
  stemAr: string;
  stemEn: string;
  options: any;
  answer: any;
  marks: number;
  bankTag: string | null;
};

export default function ExamsPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('exams');
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  if (examsLoading || questionsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('exams.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage examinations and question banks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateQuestionOpen} onOpenChange={setIsCreateQuestionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Question</DialogTitle>
                  <DialogDescription>
                    Create a new question for the question bank
                  </DialogDescription>
                </DialogHeader>
              <QuestionForm onSuccess={() => setIsCreateQuestionOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('exams.newExam')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Exam</DialogTitle>
                <DialogDescription>
                  Create a new examination
                </DialogDescription>
              </DialogHeader>
              <ExamForm onSuccess={() => setIsCreateExamOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <ExamsTab exams={examsData?.exams || []} />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <QuestionsTab questions={questionsData?.questions || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExamsTab({ exams }: { exams: Exam[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <Card key={exam.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{exam.titleAr}</CardTitle>
              <Badge variant={exam.isPublished ? 'success' : 'secondary'}>
                {exam.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <CardDescription>{exam.titleEn}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span>{exam._count.questions}</span>
              </div>
              <div className="flex justify-between">
                <span>Attempts:</span>
                <span>{exam._count.attempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span>{exam.timeLimitMins} min</span>
              </div>
              <div className="flex justify-between">
                <span>Total Marks:</span>
                <span>{exam.totalMarks}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Button variant="outline" size="sm">
                <Eye className="mr-1 h-3 w-3" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {exams.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No exams created yet.</p>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ questions }: { questions: Question[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.stemAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.stemEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || question.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="MSQ">Multiple Select</SelectItem>
                <SelectItem value="TRUEFALSE">True/False</SelectItem>
                <SelectItem value="NUMERIC">Numeric</SelectItem>
                <SelectItem value="SHORT">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-2">
        {filteredQuestions.map((question) => (
          <Card key={question.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{question.type}</Badge>
                    <Badge variant="secondary">{question.marks} marks</Badge>
                    {question.bankTag && (
                      <Badge variant="accent">{question.bankTag}</Badge>
                    )}
                  </div>
                  <h4 className="font-medium mb-1">{question.stemAr}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{question.stemEn}</p>

                  {question.type === 'MCQ' && question.options && (
                    <div className="text-sm">
                      <span className="font-medium">Options:</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {JSON.parse(question.options).map((option: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExamForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    courseId: '',
    timeLimitMins: 60,
    totalMarks: 100,
    randomize: false,
    negativeMarking: false,
    lockdown: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating exam
    console.log('Creating exam:', formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exam Title (Arabic)</Label>
          <Input
            value={formData.titleAr}
            onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Exam Title (English)</Label>
          <Input
            value={formData.titleEn}
            onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Course</Label>
        <Select
          value={formData.courseId}
          onValueChange={(value) => setFormData({ ...formData, courseId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {/* Course options would be loaded here */}
            <SelectItem value="course-1">Crowd Management 101</SelectItem>
            <SelectItem value="course-2">Radio Communication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time Limit</Label>
          <Input
            type="number"
            value={formData.timeLimitMins}
            onChange={(e) => setFormData({ ...formData, timeLimitMins: parseInt(e.target.value) })}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label>Total Marks</Label>
          <Input
            type="number"
            value={formData.totalMarks}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="randomize"
            checked={formData.randomize}
            onCheckedChange={(checked) => setFormData({ ...formData, randomize: !!checked })}
          />
          <Label htmlFor="randomize">Randomize Questions</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="negativeMarking"
            checked={formData.negativeMarking}
            onCheckedChange={(checked) => setFormData({ ...formData, negativeMarking: !!checked })}
          />
          <Label htmlFor="negativeMarking">Negative Marking</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="lockdown"
            checked={formData.lockdown}
            onCheckedChange={(checked) => setFormData({ ...formData, lockdown: !!checked })}
          />
          <Label htmlFor="lockdown">Lockdown Mode</Label>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create Exam
      </Button>
    </form>
  );
}

function QuestionForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'MCQ' as QuestionType,
    stemAr: '',
    stemEn: '',
    options: [''],
    answer: [''],
    marks: 1,
    bankTag: '',
    examId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating question
    console.log('Creating question:', formData);
    onSuccess();
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Question Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as QuestionType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MCQ">Multiple Choice</SelectItem>
            <SelectItem value="MSQ">Multiple Select</SelectItem>
            <SelectItem value="TRUEFALSE">True/False</SelectItem>
            <SelectItem value="NUMERIC">Numeric</SelectItem>
            <SelectItem value="SHORT">Short Answer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Question Stem (Arabic)</Label>
        <Textarea
          value={formData.stemAr}
          onChange={(e) => setFormData({ ...formData, stemAr: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Question Stem (English)</Label>
        <Textarea
          value={formData.stemEn}
          onChange={(e) => setFormData({ ...formData, stemEn: e.target.value })}
          required
        />
      </div>

      {(formData.type === 'MCQ' || formData.type === 'MSQ') && (
        <div className="space-y-2">
          <Label>Options</Label>
          {formData.options.map((option, index) => (
            <Input
              key={index}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
          ))}
          <Button type="button" variant="outline" onClick={addOption}>
            Add Option
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Marks</Label>
          <Input
            type="number"
            value={formData.marks}
            onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label>Bank Tag</Label>
          <Input
            value={formData.bankTag}
            onChange={(e) => setFormData({ ...formData, bankTag: e.target.value })}
            placeholder="e.g., crowd_control"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Question
      </Button>
    </form>
  );
}
