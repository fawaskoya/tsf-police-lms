import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/DashboardStats';
import { ProgressCard } from '@/components/ProgressCard';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.welcome')}, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.newCourse')}
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {t('dashboard.newSession')}
          </Button>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>}>
        <DashboardStats t={t} />
      </Suspense>

      {/* Charts and Progress */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Completion Trend Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Completion Trend</CardTitle>
            <CardDescription>
              Course completion rates over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Completion trend
            </div>
          </CardContent>
        </Card>

        {/* Unit Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Performance</CardTitle>
            <CardDescription>
              Pass rates by unit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressCard
              title="Stadium Ops"
              value={94}
              description="24 trainees"
              color="success"
            />
            <ProgressCard
              title="Cyber Security"
              value={89}
              description="18 trainees"
              color="success"
            />
            <ProgressCard
              title="Traffic Control"
              value={76}
              description="31 trainees"
              color="warning"
            />
            <ProgressCard
              title="K9 Unit"
              value={82}
              description="12 trainees"
              color="success"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
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

        {/* Additional Dashboard Content */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Platform status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Health</span>
                <span className="text-sm text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Backup</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Expiries */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Expiries</CardTitle>
          <CardDescription>
            Certificates expiring in the next 30, 60, and 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">12</div>
              <div className="text-sm text-yellow-600">Next 30 days</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">8</div>
              <div className="text-sm text-orange-600">Next 60 days</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">3</div>
              <div className="text-sm text-red-600">Next 90 days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
