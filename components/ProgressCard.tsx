'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  description?: string;
  className?: string;
  showPercentage?: boolean;
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

export function ProgressCard({
  title,
  value,
  max = 100,
  description,
  className,
  showPercentage = true,
  color = 'default',
}: ProgressCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getProgressColor = () => {
    switch (color) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'destructive':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {showPercentage ? `${Math.round(percentage)}%` : `${value}/${max}`}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        <Progress 
          value={percentage} 
          className="h-2"
          // @ts-ignore - custom color prop
          color={getProgressColor()}
        />
      </CardContent>
    </Card>
  );
}
