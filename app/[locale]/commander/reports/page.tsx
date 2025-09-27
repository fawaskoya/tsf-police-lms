import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Calendar
} from 'lucide-react';

// Mock data - in production this would come from API
const mockComplianceStats = {
  overallCompliance: 84.2,
  mandatoryTraining: 91.8,
  overdueTraining: 8.2,
  departmentsCompliant: 7,
  totalDepartments: 10,
};

const mockDepartmentReports = [
  {
    department: 'إدارة العمليات',
    complianceRate: 89.5,
    totalMembers: 120,
    trainedMembers: 107,
    overdueMembers: 13,
    mandatorySessions: 8,
    completedSessions: 7,
    status: 'good',
  },
  {
    department: 'إدارة التحقيقات',
    complianceRate: 94.2,
    totalMembers: 85,
    trainedMembers: 80,
    overdueMembers: 5,
    mandatorySessions: 6,
    completedSessions: 6,
    status: 'excellent',
  },
  {
    department: 'إدارة الدوريات',
    complianceRate: 78.3,
    totalMembers: 200,
    trainedMembers: 157,
    overdueMembers: 43,
    mandatorySessions: 10,
    completedSessions: 8,
    status: 'needs_attention',
  },
  {
    department: 'إدارة الطوارئ',
    complianceRate: 82.1,
    totalMembers: 95,
    trainedMembers: 78,
    overdueMembers: 17,
    mandatorySessions: 5,
    completedSessions: 4,
    status: 'good',
  },
];

const mockUpcomingDeadlines = [
  {
    training: 'دورة مكافحة الإرهاب',
    department: 'إدارة العمليات',
    deadline: '2024-10-15',
    participants: 45,
    status: 'upcoming',
  },
  {
    training: 'التعامل مع المتظاهرين',
    department: 'إدارة الدوريات',
    deadline: '2024-10-20',
    participants: 67,
    status: 'upcoming',
  },
  {
    training: 'أمن المعلومات',
    department: 'إدارة التحقيقات',
    deadline: '2024-09-30',
    participants: 23,
    status: 'urgent',
  },
];

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
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
            {t('reports.complianceReports')}
          </h1>
          <p className="text-muted-foreground">
            {t('reports.monitorDepartmentCompliance')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('reports.exportReport')}
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t('reports.overallCompliance')}
          value={`${mockComplianceStats.overallCompliance}%`}
          icon="Target"
          trend={{
            value: 3.2,
            label: 'vs last quarter',
            positive: true,
          }}
        />
        <StatCard
          title={t('reports.mandatoryTraining')}
          value={`${mockComplianceStats.mandatoryTraining}%`}
          icon="CheckCircle"
          trend={{
            value: 5.1,
            label: 'vs last quarter',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('reports.overdueTraining')}
          value={`${mockComplianceStats.overdueTraining}%`}
          icon="AlertTriangle"
          trend={{
            value: -2.1,
            label: 'vs last quarter',
            positive: true,
          }}
          variant="warning"
        />
        <StatCard
          title={t('reports.departmentsCompliant')}
          value={`${mockComplianceStats.departmentsCompliant}/${mockComplianceStats.totalDepartments}`}
          icon="Users"
        />
        <StatCard
          title={t('reports.trainingSessions')}
          value="89"
          icon="Calendar"
          trend={{
            value: 12,
            label: 'this quarter',
            positive: true,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.departmentCompliance')}</CardTitle>
            <CardDescription>
              {t('reports.departmentComplianceDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartmentReports.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{dept.department}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        dept.status === 'excellent'
                          ? 'bg-green-100 text-green-800'
                          : dept.status === 'good'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dept.complianceRate}%
                      </span>
                    </div>
                  </div>
                  <Progress value={dept.complianceRate} className="mb-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{dept.trainedMembers}/{dept.totalMembers}</span> {t('reports.trained')}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">{dept.overdueMembers}</span> {t('reports.overdue')}
                    </div>
                    <div>
                      <span className="font-medium">{dept.completedSessions}/{dept.mandatorySessions}</span> {t('reports.sessions')}
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        {t('reports.viewDetails')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.upcomingDeadlines')}</CardTitle>
            <CardDescription>
              {t('reports.upcomingDeadlinesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{deadline.training}</h3>
                    <p className="text-sm text-muted-foreground">
                      {deadline.department} • {deadline.participants} {t('reports.participants')}
                    </p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t('reports.deadline')}: {deadline.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deadline.status === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {deadline.status === 'urgent' ? t('reports.urgent') : t('reports.upcoming')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.quickActions')}</CardTitle>
          <CardDescription>
            {t('reports.quickActionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <AlertTriangle className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-medium">{t('reports.generateAlert')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('reports.generateAlertDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <BarChart3 className="h-6 w-6 mb-2 text-blue-500" />
              <span className="font-medium">{t('reports.complianceSummary')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('reports.complianceSummaryDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Download className="h-6 w-6 mb-2 text-green-500" />
              <span className="font-medium">{t('reports.exportData')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('reports.exportDataDesc')}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
