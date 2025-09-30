'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Zap, Shield, Clock } from 'lucide-react';

interface SystemHealthData {
  databaseStatus: 'connected' | 'disconnected' | 'error';
  apiHealth: 'operational' | 'degraded' | 'down';
  lastBackup: string;
  uptime: string;
  activeUsers: number;
  systemLoad: number;
}

export function SystemOverview() {
  const t = useTranslations();

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/system-health', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch system health');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Platform status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
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
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Platform status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load system health data</p>
        </CardContent>
      </Card>
    );
  }

  const healthData: SystemHealthData = data || {
    databaseStatus: 'connected',
    apiHealth: 'operational',
    lastBackup: '2 hours ago',
    uptime: '99.9%',
    activeUsers: 0,
    systemLoad: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'disconnected':
      case 'down':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
      case 'degraded':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'disconnected':
      case 'down':
      case 'error':
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>Platform status and performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Database Status</span>
            </div>
            {getStatusBadge(healthData.databaseStatus)}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Health</span>
            </div>
            {getStatusBadge(healthData.apiHealth)}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">System Uptime</span>
            </div>
            <span className="text-sm text-green-600 font-medium">{healthData.uptime}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Last Backup</span>
            </div>
            <span className="text-sm text-muted-foreground">{healthData.lastBackup}</span>
          </div>

          {healthData.activeUsers > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Users</span>
              <span className="text-sm text-muted-foreground">{healthData.activeUsers}</span>
            </div>
          )}

          {healthData.systemLoad > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Load</span>
              <span className="text-sm text-muted-foreground">{healthData.systemLoad}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
