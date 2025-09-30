'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Award } from 'lucide-react';

interface MonthlyTrend {
  month: string;
  monthName: string;
  completions: number;
  enrollments: number;
  completionRate: number;
}

interface CourseCompletion {
  courseId: string;
  titleEn: string;
  titleAr: string;
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
}

interface CompletionTrendData {
  monthlyTrend: MonthlyTrend[];
  courseCompletions: CourseCompletion[];
}

export function CompletionTrend() {
  const t = useTranslations();

  const { data, isLoading, error } = useQuery({
    queryKey: ['completion-trend'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/completion-trend', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch completion trend');
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Completion Trend</CardTitle>
          <CardDescription>Course completion rates over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Completion Trend</CardTitle>
          <CardDescription>Course completion rates over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Failed to load completion trend data
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendData: CompletionTrendData = data || {
    monthlyTrend: [],
    courseCompletions: []
  };

  const { monthlyTrend, courseCompletions } = trendData;

  // Calculate overall completion rate
  const totalCompletions = monthlyTrend.reduce((sum, month) => sum + month.completions, 0);
  const totalEnrollments = monthlyTrend.reduce((sum, month) => sum + month.enrollments, 0);
  const overallCompletionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Completion Trend</CardTitle>
        <CardDescription>Course completion rates over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {Math.round(overallCompletionRate * 10) / 10}%
            </div>
            <div className="text-sm text-green-600">Overall Rate</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{totalCompletions}</div>
            <div className="text-sm text-blue-600">Total Completions</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{totalEnrollments}</div>
            <div className="text-sm text-purple-600">Total Enrollments</div>
          </div>
        </div>

        {/* Monthly Trend */}
        {monthlyTrend.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3">Monthly Completion Rate</h4>
            <div className="space-y-2">
              {monthlyTrend.slice(-6).map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{month.monthName}</p>
                    <p className="text-xs text-muted-foreground">
                      {month.completions} completions of {month.enrollments} enrollments
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{month.completionRate}%</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(month.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performing Courses */}
        {courseCompletions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3">Top Performing Courses</h4>
            <div className="space-y-2">
              {courseCompletions.slice(0, 5).map((course) => (
                <div key={course.courseId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {course.titleEn || course.titleAr}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.totalCompletions} completions of {course.totalEnrollments} enrollments
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{course.completionRate}%</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(course.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
