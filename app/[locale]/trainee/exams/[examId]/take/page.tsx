'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  Timer,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

type Question = {
  id: string;
  questionAr: string;
  questionEn: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: Array<{
    id: string;
    optionAr: string;
    optionEn: string;
  }> | null;
  correctAnswer: string;
  marks: number;
};

type Exam = {
  id: string;
  titleAr: string;
  titleEn: string;
  timeLimitMins: number;
  totalMarks: number;
  randomize: boolean;
  negativeMarking: boolean;
  lockdown: boolean;
  questions: Question[];
};

type Answer = {
  questionId: string;
  answer: string | string[];
  timeSpent: number;
};

export default function TakeExamPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) throw new Error('Failed to fetch exam');
      return response.json();
    },
    enabled: !!examId,
  });

  const exam = examData?.exam as Exam;

  const submitExamMutation = useMutation({
    mutationFn: async (autoSubmit: boolean = false) => {
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.values(answers),
          autoSubmit,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit exam');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Exam submitted successfully');
      router.push(`/trainee/exams/${examId}/results`);
    },
    onError: (error) => {
      toast.error('Failed to submit exam');
      console.error('Submit error:', error);
    },
  });

  const handleSubmitExam = useCallback((autoSubmit: boolean = false) => {
    if (!autoSubmit) {
      setShowSubmitDialog(true);
      return;
    }
    submitExamMutation.mutate(autoSubmit);
  }, [submitExamMutation]);

  // Timer effect
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitExam(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining, handleSubmitExam]);

  // Initialize timer when exam loads
  useEffect(() => {
    if (exam && !examStarted) {
      setTimeRemaining(exam.timeLimitMins * 60);
    }
  }, [exam, examStarted]);

  const startExam = () => {
    setExamStarted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    const currentAnswer = answers[questionId];
    setAnswers({
      ...answers,
      [questionId]: {
        questionId,
        answer,
        timeSpent: currentAnswer ? currentAnswer.timeSpent + 1 : 0,
      },
    });
  };

  const toggleFlagQuestion = (questionId: string) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const confirmSubmitExam = () => {
    setShowSubmitDialog(false);
    submitExamMutation.mutate(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Exam not found</h2>
          <p className="text-muted-foreground">The requested exam could not be found.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / exam.questions.length) * 100;

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{exam.titleAr}</CardTitle>
            <CardDescription className="text-lg">{exam.titleEn}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">{exam.timeLimitMins} minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-lg font-semibold">{exam.questions.length}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Exam Instructions:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Answer all questions to the best of your ability</li>
                <li>You cannot go back to previous questions once submitted</li>
                <li>The timer will start when you begin the exam</li>
                {exam.negativeMarking && <li>Negative marking is applied for wrong answers</li>}
                {exam.lockdown && <li>Browser lockdown mode is enabled</li>}
              </ul>
            </div>

            <Button onClick={startExam} className="w-full" size="lg">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.titleAr}</h1>
          <p className="text-muted-foreground">{exam.titleEn}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-destructive' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={() => handleSubmitExam(false)}
            disabled={submitExamMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {answeredQuestions} of {exam.questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((question, index) => {
                const isAnswered = answers[question.id];
                const isFlagged = flaggedQuestions.has(question.id);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <Button
                    key={question.id}
                    variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                    size="sm"
                    className={`h-10 w-10 p-0 relative ${isFlagged ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                    {isFlagged && (
                      <Flag className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Question content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlagQuestion(currentQuestion.id)}
                  className={flaggedQuestions.has(currentQuestion.id) ? 'text-yellow-600' : ''}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">{currentQuestion.questionAr}</h3>
                <p className="text-muted-foreground">{currentQuestion.questionEn}</p>
              </div>

              {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.answer as string || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div>{option.optionAr}</div>
                        <div className="text-sm text-muted-foreground">{option.optionEn}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'TRUE_FALSE' && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.answer as string || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">True / صحيح</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">False / خطأ</Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === 'SHORT_ANSWER' && (
                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <textarea
                    id="answer"
                    className="w-full min-h-[100px] p-3 border rounded-md"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id]?.answer as string || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this exam? You won't be able to change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmitExam} disabled={submitExamMutation.isPending}>
              {submitExamMutation.isPending ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
