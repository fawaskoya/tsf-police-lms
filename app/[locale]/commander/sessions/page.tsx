import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Target
} from 'lucide-react';

// Mock data - in production this would come from API
const mockStats = {
  mandatorySessions: 45,
  completedSessions: 38,
  complianceRate: 84.4,
  upcomingMandatory: 7,
};

const mockUpcomingSessions = [
  {
    id: 1,
    title: 'دورة تدريبية إلزامية - إدارة الحشود',
    instructor: 'أحمد محمد',
    date: '2024-09-28',
    time: '09:00',
    duration: '2 ساعات',
    department: 'إدارة العمليات',
    attendance: 'إلزامي',
    participants: 45,
    present: 0,
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'دورة تدريبية إلزامية - التحقيق الجنائي',
    instructor: 'فاطمة علي',
    date: '2024-09-29',
    time: '14:00',
    duration: '3 ساعات',
    department: 'إدارة التحقيقات',
    attendance: 'إلزامي',
    participants: 32,
    present: 0,
    status: 'upcoming',
  },
];

const mockComplianceData = [
  {
    department: 'إدارة العمليات',
    totalMembers: 120,
    completedSessions: 95,
    complianceRate: 79.2,
  },
  {
    department: 'إدارة التحقيقات',
    totalMembers: 85,
    completedSessions: 78,
    complianceRate: 91.8,
  },
  {
    department: 'إدارة الدوريات',
    totalMembers: 200,
    completedSessions: 156,
    complianceRate: 78.0,
  },
];

export default async function SessionsPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('sessions.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('sessions.monitorCompliance')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('sessions.viewReports')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('sessions.mandatorySessions')}
          value={mockStats.mandatorySessions.toString()}
          icon="Target"
          trend={{
            value: 12,
            label: 'this quarter',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.completedSessions')}
          value={mockStats.completedSessions.toString()}
          icon="CheckCircle"
          trend={{
            value: 8.5,
            label: 'vs last quarter',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('sessions.complianceRate')}
          value={`${mockStats.complianceRate}%`}
          icon="TrendingUp"
          trend={{
            value: 5.2,
            label: 'vs last quarter',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.upcomingMandatory')}
          value={mockStats.upcomingMandatory.toString()}
          icon="Clock"
          trend={{
            value: -2,
            label: 'vs last week',
            positive: false,
          }}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Mandatory Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.upcomingMandatory')}</CardTitle>
            <CardDescription>
              {t('sessions.upcomingMandatoryDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Target className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.instructor} • {session.date} • {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.department} • {session.duration}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {session.attendance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {session.participants} {t('sessions.participants')}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      {t('sessions.trackAttendance')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.departmentCompliance')}</CardTitle>
            <CardDescription>
              {t('sessions.departmentComplianceDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockComplianceData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{dept.department}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dept.completedSessions}/{dept.totalMembers} {t('sessions.completed')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {dept.complianceRate}%
                    </div>
                    <div className={`text-sm ${
                      dept.complianceRate >= 90 ? 'text-green-600' :
                      dept.complianceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {dept.complianceRate >= 90 ? t('sessions.excellent') :
                       dept.complianceRate >= 75 ? t('sessions.good') : t('sessions.needsImprovement')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
