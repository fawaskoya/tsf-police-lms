import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/DashboardStats';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { UnitPerformance } from '@/components/UnitPerformance';
import { CertificateExpiries } from '@/components/CertificateExpiries';
import { CompletionTrend } from '@/components/CompletionTrend';
import { SystemOverview } from '@/components/SystemOverview';
import { RecentActivity } from '@/components/RecentActivity';
import { 
  BookOpen, 
  Calendar, 
  Plus,
  FileText,
  Upload
} from 'lucide-react';

// Dashboard data is now fetched from API via DashboardStats component

export default async function AdminDashboard() {
  const session = await getServerSession();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader 
        userName={session?.user?.name || ''}
      />

      {/* Dashboard Statistics */}
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>}>
        <DashboardStats />
      </Suspense>

      {/* Charts and Progress */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Completion Trend Chart */}
        <Suspense fallback={
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Completion Trend</CardTitle>
              <CardDescription>Course completion rates over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading completion trend...
              </div>
            </CardContent>
          </Card>
        }>
          <CompletionTrend />
        </Suspense>

        {/* Unit Performance */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>Unit Performance</CardTitle>
              <CardDescription>Pass rates by unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading unit performance...
              </div>
            </CardContent>
          </Card>
        }>
          <UnitPerformance />
        </Suspense>
      </div>

      {/* Quick Actions, System Overview, and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              {t('dashboard.newCourse')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {t('dashboard.newSession')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              {t('dashboard.importUsers')}
            </Button>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Platform status and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Loading system overview...
              </div>
            </CardContent>
          </Card>
        }>
          <SystemOverview />
        </Suspense>

        {/* Recent Activity */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>Latest activities across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Loading recent activity...
              </div>
            </CardContent>
          </Card>
        }>
          <RecentActivity />
        </Suspense>
      </div>

      {/* Certificate Expiries */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Certificate Expiries</CardTitle>
            <CardDescription>Certificates expiring in the next 30, 60, and 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Loading certificate expiry data...
            </div>
          </CardContent>
        </Card>
      }>
        <CertificateExpiries />
      </Suspense>
    </div>
  );
}
