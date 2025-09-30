'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressCard } from '@/components/ProgressCard';
import { Skeleton } from '@/components/ui/skeleton';

interface UnitPerformanceData {
  unit: string;
  traineeCount: number;
  passRate: number;
  totalAttempts: number;
}

export function UnitPerformance() {
  const t = useTranslations();

  const { data, isLoading, error } = useQuery({
    queryKey: ['unit-performance'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/unit-performance', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch unit performance');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit Performance</CardTitle>
          <CardDescription>Pass rates by unit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit Performance</CardTitle>
          <CardDescription>Pass rates by unit</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load unit performance data</p>
        </CardContent>
      </Card>
    );
  }

  const unitPerformance: UnitPerformanceData[] = data?.unitPerformance || [];

  if (unitPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit Performance</CardTitle>
          <CardDescription>Pass rates by unit</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No unit performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Performance</CardTitle>
        <CardDescription>Pass rates by unit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unitPerformance.map((unit) => (
          <ProgressCard
            key={unit.unit}
            title={unit.unit}
            value={unit.passRate}
            max={100}
            description={`${unit.traineeCount} trainees`}
            color={
              unit.passRate >= 90 ? 'success' :
              unit.passRate >= 75 ? 'warning' : 'destructive'
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}
