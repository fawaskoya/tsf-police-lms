import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { ProgressCard } from '@/components/ProgressCard';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Upload
} from 'lucide-react';

// Mock data - in production this would come from API
const mockStats = {
  activeTrainees: 1247,
  completionRate: 87.5,
  overdueCerts: 23,
  sessionsToday: 8,
  examPassRate: 92.3,
};

const mockRecentActivity = [
  {
    id: 1,
    action: 'Completed course',
    user: 'أحمد محمد',
    course: 'إدارة الحشود في المنشآت الرياضية',
    time: '2 hours ago',
  },
  {
    id: 2,
    action: 'Passed exam',
    user: 'فاطمة علي',
    course: 'انضباط أجهزة الاتصال اللاسلكي',
    time: '4 hours ago',
  },
  {
    id: 3,
    action: 'Enrolled in course',
    user: 'محمد السعد',
    course: 'سلسلة حيازة الأدلة',
    time: '6 hours ago',
  },
];

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t('dashboard.activeTrainees')}
          value={mockStats.activeTrainees.toLocaleString()}
          icon="Users"
          trend={{
            value: 12,
            label: 'vs last month',
            positive: true,
          }}
        />
        <StatCard
          title={t('dashboard.completionRate')}
          value={`${mockStats.completionRate}%`}
          icon="TrendingUp"
          trend={{
            value: 5.2,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('dashboard.overdueCerts')}
          value={mockStats.overdueCerts}
          icon="AlertTriangle"
          trend={{
            value: 8,
            label: 'vs last month',
            positive: false,
          }}
          variant="warning"
        />
        <StatCard
          title={t('dashboard.sessionsToday')}
          value={mockStats.sessionsToday}
          icon="Calendar"
        />
        <StatCard
          title={t('dashboard.examPassRate')}
          value={`${mockStats.examPassRate}%`}
          icon="Award"
          trend={{
            value: 2.1,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
      </div>

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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>
              Latest user activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.user} {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.course}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
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
