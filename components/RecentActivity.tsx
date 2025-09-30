'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, User, BookOpen, Award, Calendar } from 'lucide-react';

interface ActivityData {
  id: string;
  action: string;
  user: string;
  details: string;
  time: string;
  type: 'course' | 'exam' | 'session' | 'user' | 'system';
}

export function RecentActivity() {
  const t = useTranslations();

  const { data, isLoading, error } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      const result = await response.json();
      return result.recentActivity || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>Latest activities across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>Latest activities across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load recent activity</p>
        </CardContent>
      </Card>
    );
  }

  const activities: ActivityData[] = data || [];

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('course') || actionLower.includes('completed')) {
      return <BookOpen className="h-3 w-3" />;
    } else if (actionLower.includes('exam') || actionLower.includes('passed')) {
      return <Award className="h-3 w-3" />;
    } else if (actionLower.includes('session') || actionLower.includes('attended')) {
      return <Calendar className="h-3 w-3" />;
    } else if (actionLower.includes('user') || actionLower.includes('registered')) {
      return <User className="h-3 w-3" />;
    }
    return <Activity className="h-3 w-3" />;
  };

  const formatTimeAgo = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        <CardDescription>Latest activities across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground">
                      {activity.details}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.time)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as users interact with the system
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
