'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, RefreshCw, Filter, Download, Trash2 } from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  source: 'API' | 'CLIENT' | 'MIDDLEWARE' | 'DATABASE';
  endpoint?: string;
  method?: string;
  userId?: string;
  userAgent?: string;
  stack?: string;
  context?: any;
}

export default function ErrorsPage() {
  const t = useTranslations();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Mock error data - in production, this would come from your error tracking service
  const mockErrors: ErrorLog[] = [
    {
      id: '1',
      timestamp: '2025-09-29T21:15:00Z',
      level: 'ERROR',
      message: 'Validation failed for session creation',
      source: 'API',
      endpoint: '/api/sessions',
      method: 'POST',
      userId: 'admin@kbn.local',
      stack: 'ValidationError: Input validation failed\n    at validateInput...',
    },
    {
      id: '2',
      timestamp: '2025-09-29T21:14:30Z',
      level: 'WARN',
      message: 'Invalid instructor role validation',
      source: 'API',
      endpoint: '/api/sessions',
      method: 'POST',
      userId: 'admin@kbn.local',
    },
    {
      id: '3',
      timestamp: '2025-09-29T21:10:00Z',
      level: 'ERROR',
      message: 'Prisma relation error in certificates API',
      source: 'API',
      endpoint: '/api/certificates',
      method: 'GET',
      stack: 'PrismaClientKnownRequestError: Invalid prisma.certificate.findMany()...',
    },
    {
      id: '4',
      timestamp: '2025-09-29T21:05:00Z',
      level: 'INFO',
      message: 'User login successful',
      source: 'API',
      endpoint: '/api/auth/login',
      method: 'POST',
      userId: 'admin@kbn.local',
    },
  ];

  useEffect(() => {
    // Simulate loading error logs
    setTimeout(() => {
      setErrors(mockErrors);
      setFilteredErrors(mockErrors);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = errors;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(error =>
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(error => error.level === levelFilter);
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(error => error.source === sourceFilter);
    }

    setFilteredErrors(filtered);
  }, [errors, searchTerm, levelFilter, sourceFilter]);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      default: return 'outline';
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'API': return 'default';
      case 'CLIENT': return 'secondary';
      case 'MIDDLEWARE': return 'outline';
      case 'DATABASE': return 'destructive';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const clearErrors = () => {
    setErrors([]);
    setFilteredErrors([]);
  };

  const exportErrors = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Source', 'Message', 'Endpoint', 'Method', 'User ID'],
      ...filteredErrors.map(error => [
        error.timestamp,
        error.level,
        error.source,
        error.message,
        error.endpoint || '',
        error.method || '',
        error.userId || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error Monitoring</h1>
            <p className="text-muted-foreground">Monitor and manage application errors</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and manage application errors in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportErrors} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={clearErrors} variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errors.length}</div>
            <p className="text-xs text-muted-foreground">
              All time errors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {errors.filter(e => e.level === 'ERROR').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {errors.filter(e => e.level === 'WARN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {errors.filter(e => e.source === 'API').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Backend issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="ERROR">Errors</SelectItem>
                  <SelectItem value="WARN">Warnings</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="MIDDLEWARE">Middleware</SelectItem>
                  <SelectItem value="DATABASE">Database</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
          <CardDescription>
            Showing {filteredErrors.length} of {errors.length} errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No errors found matching your filters.
              </div>
            ) : (
              filteredErrors.map((error) => (
                <div key={error.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelBadgeVariant(error.level)}>
                        {error.level}
                      </Badge>
                      <Badge variant={getSourceBadgeVariant(error.source)}>
                        {error.source}
                      </Badge>
                      {error.endpoint && (
                        <Badge variant="outline">
                          {error.method} {error.endpoint}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(error.timestamp)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{error.message}</p>
                    {error.userId && (
                      <p className="text-sm text-muted-foreground">
                        User: {error.userId}
                      </p>
                    )}
                  </div>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-32 bg-muted p-2 rounded border">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
