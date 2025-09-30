'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/StatCard';
import { ProgressCard } from '@/components/ProgressCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

export function DashboardStats() {
  const t = useTranslations();
  const useMock = 
    process.env.NODE_ENV !== 'production' &&
    ((process.env.NEXT_PUBLIC_USE_MOCK ?? '').trim() === '1' ||
     (process.env.USE_MOCK ?? '').toLowerCase() === 'true');

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (useMock) {
        // Return mock data in development when explicitly enabled
        return {
          stats: {
            activeTrainees: 1247,
            completionRate: 87.5,
            overdueCerts: 23,
            sessionsToday: 8,
            examPassRate: 92.3,
            totalUsers: 1500,
            totalCourses: 25,
            totalExams: 45,
          },
          recentActivity: [
            {
              id: '1',
              action: 'completed course',
              user: 'أحمد الكبير',
              details: 'Police Fundamentals',
              time: new Date().toISOString(),
            },
          ],
        };
      }
      
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error && !useMock) {
    // Only show error in production when not using mocks
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Failed to load dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.activeTrainees')}
          value={stats.activeTrainees?.toLocaleString() || '0'}
          icon="Users"
          trend={{ value: 12, label: '+12% vs last month' }}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title={t('dashboard.completionRate')}
          value={`${stats.completionRate || 0}%`}
          icon="TrendingUp"
          trend={{ value: 5.2, label: '+5.2% vs last month' }}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title={t('dashboard.overdueCerts')}
          value={stats.overdueCerts?.toString() || '0'}
          icon="AlertTriangle"
          trend={{ value: -8, label: '8% vs last month' }}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title={t('dashboard.sessionsToday')}
          value={stats.sessionsToday?.toString() || '0'}
          icon="Clock"
          className="border-l-4 border-l-gray-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProgressCard
          title={t('dashboard.examPassRate')}
          value={stats.examPassRate || 0}
          max={100}
          className="border-l-4 border-l-blue-500"
        />
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalCourses')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>
            Latest activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {activity.user} {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.details || activity.course}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.time).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
