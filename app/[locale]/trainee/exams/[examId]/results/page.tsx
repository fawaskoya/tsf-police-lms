'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  Download,
  Share,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type Question = {
  id: string;
  questionAr: string;
  questionEn: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  correctAnswer: string;
  marks: number;
  options: Array<{
    id: string;
    optionAr: string;
    optionEn: string;
  }> | null;
};

type Answer = {
  id: string;
  answer: string;
  isCorrect: boolean;
  marks: number;
  timeSpent: number;
  question: Question;
};

type Attempt = {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  createdAt: string;
  answers: Answer[];
};

type Exam = {
  id: string;
  titleAr: string;
  titleEn: string;
  timeLimitMins: number;
  totalMarks: number;
};

export default function ExamResultsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['exam-results', examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examId}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    enabled: !!examId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  const { exam, attempt } = resultsData || {};
  const passed = attempt?.percentage >= 60;

  if (!exam || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Results not found</h2>
          <p className="text-muted-foreground">Unable to load exam results.</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C';
    return 'F';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Exam Results</h1>
          <p className="text-muted-foreground">Review your performance</p>
        </div>
      </div>

      {/* Results Overview */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <CardTitle className="text-2xl">
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </CardTitle>
          </div>
          <CardDescription className="text-lg">{exam.titleAr}</CardDescription>
          <CardDescription>{exam.titleEn}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className={`text-2xl font-bold ${getGradeColor(attempt.percentage)}`}>
                {attempt.score}/{attempt.maxScore}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className={`text-2xl font-bold ${getGradeColor(attempt.percentage)}`}>
                {Math.round(attempt.percentage)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className={`text-2xl font-bold ${getGradeColor(attempt.percentage)}`}>
                {getGradeLetter(attempt.percentage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-2xl font-bold">{formatTime(attempt.timeSpent)}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance</span>
              <Badge variant={passed ? 'success' : 'destructive'}>
                {passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
            <Progress value={attempt.percentage} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              Minimum passing score: 60%
            </p>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
            <Button variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>Review each question and your answers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attempt.answers.map((answer: Answer, index: number) => (
            <div key={answer.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium mb-2">
                    Question {index + 1}: {answer.question.questionAr}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {answer.question.questionEn}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={answer.isCorrect ? 'success' : 'destructive'}>
                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {answer.marks}/{answer.question.marks} marks
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Your Answer:</h5>
                  <div className="p-3 bg-muted rounded-md">
                    {answer.question.type === 'MULTIPLE_CHOICE' && answer.question.options ? (
                      <p>
                        {answer.question.options.find(opt => opt.id === answer.answer)?.optionAr ||
                         answer.question.options.find(opt => opt.id === answer.answer)?.optionEn ||
                         answer.answer}
                      </p>
                    ) : (
                      <p>{answer.answer}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Correct Answer:</h5>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    {answer.question.type === 'MULTIPLE_CHOICE' && answer.question.options ? (
                      <p>
                        {answer.question.options.find(opt => opt.id === answer.question.correctAnswer)?.optionAr ||
                         answer.question.options.find(opt => opt.id === answer.question.correctAnswer)?.optionEn ||
                         answer.question.correctAnswer}
                      </p>
                    ) : answer.question.type === 'TRUE_FALSE' ? (
                      <p>{answer.question.correctAnswer === 'true' ? 'True / صحيح' : 'False / خطأ'}</p>
                    ) : (
                      <p>{answer.question.correctAnswer}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time spent: {formatTime(answer.timeSpent)}</span>
                </div>
                {answer.question.type === 'MULTIPLE_CHOICE' && (
                  <div className="text-sm text-muted-foreground">
                    {answer.question.options?.length} options available
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => router.push('/trainee/my-learning')}>
          Back to My Learning
        </Button>
        <Button variant="outline" onClick={() => router.push('/trainee/certificates')}>
          View Certificates
        </Button>
      </div>
    </div>
  );
}
